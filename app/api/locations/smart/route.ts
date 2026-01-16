import { NextResponse } from 'next/server';
import { amadeus } from '@/lib/amadeus-client';
import { getGroqClient } from '@/lib/groq-client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    if (!keyword || keyword.length < 2) {
        return NextResponse.json({ locations: [], suggestions: [], aiInsight: null });
    }

    try {
        // Smart pattern-based detection (fallback when AI is unavailable)
        const patternAnalysis = analyzeLocationPattern(keyword);
        
        // Try AI analysis only if pattern detection is uncertain
        let aiAnalysis = patternAnalysis;
        if (patternAnalysis.confidence < 0.9) {
            try {
                const aiClient = getGroqClient();
                aiAnalysis = await analyzeLocationQuery(aiClient, keyword);
            } catch (aiError: any) {
                // AI failed (rate limit or error), use pattern-based analysis
                console.log('AI unavailable, using pattern matching:', aiError.message);
                aiAnalysis = patternAnalysis;
            }
        }

        let locations: any[] = [];

        // Strategy 1: If AI detected a country with high confidence, search comprehensively
        if (aiAnalysis.detectedType === 'country' && aiAnalysis.detectedCountry && aiAnalysis.confidence > 0.8) {
            // Search with multiple strategies for better coverage
            const searchTerms = [
                aiAnalysis.detectedCountry, // Full country name
                keyword.toLowerCase(), // Original keyword
            ];

            // Add common city names for popular countries
            const majorCitiesByCountry: Record<string, string[]> = {
                'india': ['delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad'],
                'united states': ['new york', 'los angeles', 'chicago', 'houston', 'miami', 'san francisco'],
                'japan': ['tokyo', 'osaka', 'nagoya', 'fukuoka', 'sapporo'],
                'thailand': ['bangkok', 'phuket', 'chiang mai', 'pattaya'],
                'united kingdom': ['london', 'manchester', 'birmingham', 'glasgow', 'edinburgh'],
                'france': ['paris', 'marseille', 'lyon', 'nice', 'toulouse'],
                'germany': ['berlin', 'munich', 'frankfurt', 'hamburg', 'cologne'],
                'spain': ['madrid', 'barcelona', 'valencia', 'seville', 'malaga'],
                'italy': ['rome', 'milan', 'venice', 'florence', 'naples'],
            };

            const countryKey = aiAnalysis.detectedCountry.toLowerCase();
            if (majorCitiesByCountry[countryKey]) {
                searchTerms.push(...majorCitiesByCountry[countryKey]);
            }

            // Search for each term and combine results
            const allResults = new Map<string, any>(); // Use Map to deduplicate by airport code

            for (const term of searchTerms.slice(0, 10)) { // Limit to prevent too many API calls
                try {
                    const response = await amadeus.referenceData.locations.get({
                        keyword: term,
                        subType: 'AIRPORT,CITY'
                    });

                    response.data.forEach((loc: any) => {
                        const code = loc.iataCode;
                        const country = loc.address?.countryName || '';
                        
                        // Only include if it matches the detected country
                        if (country.toLowerCase() === aiAnalysis.detectedCountry?.toLowerCase()) {
                            if (!allResults.has(code)) {
                                allResults.set(code, {
                                    code: loc.iataCode,
                                    name: loc.name,
                                    city: loc.address?.cityName || loc.name,
                                    country: loc.address?.countryName || '',
                                    countryCode: loc.address?.countryCode || '',
                                    type: loc.subType
                                });
                            }
                        }
                    });
                } catch (error) {
                    // Continue with next search term
                    continue;
                }
            }

            locations = Array.from(allResults.values());
        } 
        // Strategy 2: City or partial search
        else {
            // Standard search with original keyword
            const response = await amadeus.referenceData.locations.get({
                keyword,
                subType: 'AIRPORT,CITY'
            });

            locations = response.data.map((loc: any) => ({
                code: loc.iataCode,
                name: loc.name,
                city: loc.address?.cityName || loc.name,
                country: loc.address?.countryName || '',
                countryCode: loc.address?.countryCode || '',
                type: loc.subType
            }));

            // If AI detected a city, prioritize that country's results
            if (aiAnalysis.detectedType === 'city' && aiAnalysis.detectedCity && aiAnalysis.confidence > 0.7) {
                const cityLocations = locations.filter((loc: any) => 
                    loc.city.toLowerCase().includes(aiAnalysis.detectedCity?.toLowerCase() || '') ||
                    (aiAnalysis.detectedCountry && loc.country.toLowerCase() === aiAnalysis.detectedCountry.toLowerCase())
                );

                if (cityLocations.length > 0) {
                    locations = cityLocations;
                }
            }
        }

        // Sort by relevance
        locations = sortByRelevance(locations, keyword, aiAnalysis);

        // Generate smart suggestions
        const suggestions = generateSmartSuggestions(aiAnalysis, keyword);

        return NextResponse.json({ 
            locations: locations.slice(0, 50), // Limit to 50 results
            suggestions,
            aiInsight: {
                detectedType: aiAnalysis.detectedType,
                detectedCountry: aiAnalysis.detectedCountry,
                detectedCity: aiAnalysis.detectedCity,
                confidence: aiAnalysis.confidence,
                searchTips: aiAnalysis.searchTips
            }
        });
    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Smart Location API Error:', error.message);
        }
        
        // Fallback to regular search if AI fails
        try {
            const response = await amadeus.referenceData.locations.get({
                keyword,
                subType: 'AIRPORT,CITY'
            });

            const locations = response.data.map((loc: any) => ({
                code: loc.iataCode,
                name: loc.name,
                city: loc.address?.cityName || loc.name,
                country: loc.address?.countryName || '',
                countryCode: loc.address?.countryCode || '',
                type: loc.subType
            }));

            return NextResponse.json({ locations, suggestions: [], aiInsight: null });
        } catch (fallbackError) {
            return NextResponse.json({ locations: [], suggestions: [], aiInsight: null });
        }
    }
}

interface AILocationAnalysis {
    detectedType: 'country' | 'city' | 'airport' | 'region' | 'unknown';
    detectedCountry: string | null;
    detectedCity: string | null;
    confidence: number;
    searchTips: string[];
}

// Pattern-based location detection (works without AI)
function analyzeLocationPattern(query: string): AILocationAnalysis {
    const lowerQuery = query.toLowerCase().trim();
    
    // Known countries database
    const countries: Record<string, { name: string; tips: string[]; cities: string[] }> = {
        'india': { name: 'India', tips: ['Major airports: Delhi (DEL), Mumbai (BOM), Bangalore (BLR)'], cities: ['delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad'] },
        'ind': { name: 'India', tips: ['Major airports: Delhi (DEL), Mumbai (BOM), Bangalore (BLR)'], cities: ['delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad'] },
        'japan': { name: 'Japan', tips: ['Major airports: Tokyo (NRT/HND), Osaka (KIX)'], cities: ['tokyo', 'osaka', 'nagoya'] },
        'thailand': { name: 'Thailand', tips: ['Major airports: Bangkok (BKK), Phuket (HKT)'], cities: ['bangkok', 'phuket', 'chiang mai'] },
        'thai': { name: 'Thailand', tips: ['Major airports: Bangkok (BKK), Phuket (HKT)'], cities: ['bangkok', 'phuket', 'chiang mai'] },
        'usa': { name: 'United States', tips: ['Major airports: JFK, LAX, ORD, MIA'], cities: ['new york', 'los angeles', 'chicago'] },
        'united states': { name: 'United States', tips: ['Major airports: JFK, LAX, ORD, MIA'], cities: ['new york', 'los angeles', 'chicago'] },
        'uk': { name: 'United Kingdom', tips: ['Major airports: London (LHR), Manchester (MAN)'], cities: ['london', 'manchester', 'birmingham'] },
        'united kingdom': { name: 'United Kingdom', tips: ['Major airports: London (LHR), Manchester (MAN)'], cities: ['london', 'manchester', 'birmingham'] },
        'france': { name: 'France', tips: ['Major airports: Paris (CDG), Nice (NCE)'], cities: ['paris', 'marseille', 'lyon'] },
        'germany': { name: 'Germany', tips: ['Major airports: Frankfurt (FRA), Munich (MUC)'], cities: ['berlin', 'munich', 'frankfurt'] },
        'spain': { name: 'Spain', tips: ['Major airports: Madrid (MAD), Barcelona (BCN)'], cities: ['madrid', 'barcelona', 'valencia'] },
        'italy': { name: 'Italy', tips: ['Major airports: Rome (FCO), Milan (MXP)'], cities: ['rome', 'milan', 'venice'] },
        'china': { name: 'China', tips: ['Major airports: Beijing (PEK), Shanghai (PVG)'], cities: ['beijing', 'shanghai', 'guangzhou'] },
        'australia': { name: 'Australia', tips: ['Major airports: Sydney (SYD), Melbourne (MEL)'], cities: ['sydney', 'melbourne', 'brisbane'] },
        'canada': { name: 'Canada', tips: ['Major airports: Toronto (YYZ), Vancouver (YVR)'], cities: ['toronto', 'vancouver', 'montreal'] },
        'brazil': { name: 'Brazil', tips: ['Major airports: São Paulo (GRU), Rio (GIG)'], cities: ['sao paulo', 'rio de janeiro', 'brasilia'] },
        'mexico': { name: 'Mexico', tips: ['Major airports: Mexico City (MEX), Cancun (CUN)'], cities: ['mexico city', 'cancun', 'guadalajara'] },
    };

    // Check for exact or partial country match
    for (const [key, value] of Object.entries(countries)) {
        if (lowerQuery === key || key.startsWith(lowerQuery)) {
            return {
                detectedType: 'country',
                detectedCountry: value.name,
                detectedCity: null,
                confidence: lowerQuery === key ? 0.95 : 0.85,
                searchTips: value.tips
            };
        }
    }

    // Check if it's a 3-letter airport code
    if (/^[a-z]{3}$/i.test(lowerQuery)) {
        return {
            detectedType: 'airport',
            detectedCountry: null,
            detectedCity: null,
            confidence: 0.9,
            searchTips: [`Searching for airport code: ${lowerQuery.toUpperCase()}`]
        };
    }

    // Likely a city search
    return {
        detectedType: 'city',
        detectedCountry: null,
        detectedCity: query,
        confidence: 0.6,
        searchTips: ['Try adding country name for better results']
    };
}

async function analyzeLocationQuery(client: any, query: string): Promise<AILocationAnalysis> {
    const systemPrompt = `You are a location search expert. Analyze travel location queries and determine what the user is searching for.

CRITICAL: Be very precise about country detection. "India" = country India, NOT Indiana, USA.

Respond ONLY with valid JSON (no markdown, no code blocks) with these fields:
- detectedType: "country", "city", "airport", "region", or "unknown"
- detectedCountry: Full EXACT country name (e.g., "India", "United States", "Japan", "Thailand")
- detectedCity: City name if detected (e.g., "Mumbai", "Tokyo", "New York")
- confidence: Number 0-1 indicating confidence (use 0.95+ for obvious country names)
- searchTips: Array of 1-2 helpful tips for better results

Examples:
Query: "india"
Response: {"detectedType":"country","detectedCountry":"India","detectedCity":null,"confidence":0.98,"searchTips":["Major airports: Delhi (DEL), Mumbai (BOM), Bangalore (BLR)"]}

Query: "ind"
Response: {"detectedType":"country","detectedCountry":"India","detectedCity":null,"confidence":0.85,"searchTips":["Showing airports in India"]}

Query: "indiana"
Response: {"detectedType":"region","detectedCountry":"United States","detectedCity":null,"confidence":0.9,"searchTips":["Indiana is a US state. Major airport: Indianapolis (IND)"]}

Query: "mumbai"
Response: {"detectedType":"city","detectedCountry":"India","detectedCity":"Mumbai","confidence":0.95,"searchTips":["Mumbai has Chhatrapati Shivaji International Airport (BOM)"]}

Query: "del"
Response: {"detectedType":"airport","detectedCountry":"India","detectedCity":"Delhi","confidence":0.9,"searchTips":["DEL is Indira Gandhi International Airport in Delhi"]}

Query: "thailand"
Response: {"detectedType":"country","detectedCountry":"Thailand","detectedCity":null,"confidence":0.98,"searchTips":["Major airports: Bangkok (BKK), Phuket (HKT), Chiang Mai (CNX)"]}

Query: "japan"
Response: {"detectedType":"country","detectedCountry":"Japan","detectedCity":null,"confidence":0.98,"searchTips":["Major airports: Tokyo (NRT/HND), Osaka (KIX), Nagoya (NGO)"]}`;

    try {
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: query }
        ];

        const response = await client.chat(messages, undefined, 0.3, true);
        const content = response.choices[0]?.message?.content || '{}';
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        return JSON.parse(cleanContent);
    } catch (error) {
        console.error('AI analysis failed:', error);
        return {
            detectedType: 'unknown',
            detectedCountry: null,
            detectedCity: null,
            confidence: 0,
            searchTips: []
        };
    }
}

function sortByRelevance(locations: any[], keyword: string, aiAnalysis: AILocationAnalysis): any[] {
    const searchLower = keyword.toLowerCase();
    
    return locations.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // If AI detected country, prioritize exact country matches
        if (aiAnalysis.detectedCountry) {
            if (a.country.toLowerCase() === aiAnalysis.detectedCountry.toLowerCase()) scoreA += 1000;
            if (b.country.toLowerCase() === aiAnalysis.detectedCountry.toLowerCase()) scoreB += 1000;
        }

        // If AI detected city, prioritize city matches
        if (aiAnalysis.detectedCity) {
            if (a.city.toLowerCase().includes(aiAnalysis.detectedCity.toLowerCase())) scoreA += 500;
            if (b.city.toLowerCase().includes(aiAnalysis.detectedCity.toLowerCase())) scoreB += 500;
        }

        // Exact code match
        if (a.code.toLowerCase() === searchLower) scoreA += 100;
        if (b.code.toLowerCase() === searchLower) scoreB += 100;

        // City name starts with query
        if (a.city.toLowerCase().startsWith(searchLower)) scoreA += 50;
        if (b.city.toLowerCase().startsWith(searchLower)) scoreB += 50;

        // Country name starts with query
        if (a.country.toLowerCase().startsWith(searchLower)) scoreA += 30;
        if (b.country.toLowerCase().startsWith(searchLower)) scoreB += 30;

        // Contains query
        if (a.city.toLowerCase().includes(searchLower)) scoreA += 10;
        if (b.city.toLowerCase().includes(searchLower)) scoreB += 10;

        if (scoreB !== scoreA) {
            return scoreB - scoreA;
        }

        // Alphabetical by city as tiebreaker
        return a.city.localeCompare(b.city);
    });
}

function generateSmartSuggestions(aiAnalysis: AILocationAnalysis, query: string): string[] {
    const suggestions: string[] = [];

    if (aiAnalysis.detectedType === 'country' && aiAnalysis.detectedCountry && aiAnalysis.confidence > 0.8) {
        suggestions.push(`Showing all airports in ${aiAnalysis.detectedCountry}`);
        if (aiAnalysis.searchTips.length > 0) {
            suggestions.push(aiAnalysis.searchTips[0]);
        }
    } else if (aiAnalysis.detectedType === 'city' && aiAnalysis.detectedCity) {
        suggestions.push(`Found airports near ${aiAnalysis.detectedCity}`);
        if (aiAnalysis.searchTips.length > 0) {
            suggestions.push(aiAnalysis.searchTips[0]);
        }
    } else if (aiAnalysis.detectedType === 'airport' && aiAnalysis.searchTips.length > 0) {
        suggestions.push(...aiAnalysis.searchTips);
    } else if (aiAnalysis.detectedType === 'region') {
        suggestions.push(...aiAnalysis.searchTips);
    } else if (aiAnalysis.confidence < 0.5) {
        suggestions.push(`💡 Tip: Try specific country names (e.g., "India", "Japan", "Thailand")`);
    }

    return suggestions.slice(0, 2);
}
