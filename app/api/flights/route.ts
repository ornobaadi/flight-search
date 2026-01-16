import { NextResponse } from 'next/server';
import { amadeus } from '@/lib/amadeus-client';
import { Flight, Airline, Airport } from '@/lib/api/types';
import { format } from 'date-fns';
import { convertToUSD } from '@/lib/currency-converter';

// Helper to look up airline names (Mock/Hardcoded mostly as API returns codes, 
// though Dictionaries in response contain them, we'll try to use that)
const getAirlineLogo = (code: string) => `https://pic.avs.io/al/100/100/${code}.png`; // Using popular CDN for logos

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');

    if (!origin || !destination || !date) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        // 1. Call Amadeus API
        // Format date efficiently: YYYY-MM-DD
        // If date has time, strip it.
        const dateObj = new Date(date);
        const departureDate = format(dateObj, 'yyyy-MM-dd');

        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            adults: '1',
            max: '20'
        });

        const data = response.data; // The flight offers
        const dictionaries = response.result?.dictionaries; // Lookup tables for codes

        // 2. Map Response to our Schema and convert prices to USD
        const flights: Flight[] = await Promise.all(data.map(async (offer: any) => {
            const itinerary = offer.itineraries[0]; // Assume one-way for MVP
            const segments = itinerary.segments;
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            // Calculate total stops
            const stops = segments.length - 1;

            // Duration in ISO8601 (PT2H30M) -> Convert to minutes
            // Simple regex parser for MVP
            const parseDuration = (pt: string) => {
                const matches = pt.match(/PT(\d+H)?(\d+M)?/);
                if (!matches) return 0;
                const h = matches[1] ? parseInt(matches[1].replace('H', '')) : 0;
                const m = matches[2] ? parseInt(matches[2].replace('M', '')) : 0;
                return (h * 60) + m;
            };

            const durationMinutes = parseDuration(itinerary.duration);

            // Airline Info
            const carrierCode = firstSegment.carrierCode;
            const carrierName = dictionaries?.carriers?.[carrierCode] || carrierCode;

            const airline: Airline = {
                code: carrierCode,
                name: carrierName,
                logo: getAirlineLogo(carrierCode)
            };

            // Price - Convert to USD
            const originalPrice = parseFloat(offer.price.total);
            const originalCurrency = offer.price.currency;
            const priceInUSD = await convertToUSD(originalPrice, originalCurrency);

            // Construct Departure/Arrival
            // Need to look up airport names from dictionaries if possible, else use ID
            const depCode = firstSegment.departure.iataCode;
            const arrCode = lastSegment.arrival.iataCode;

            // Note: Dictionaries usually have locations -> { IATA: { cityCode, countryCode } }
            // For full names, we might need a backup or just use the code if dictionary fails
            // Amadeus dictionaries for locations look like: locations: { LHR: { cityCode: 'LON', countryCode: 'GB' } }
            const depLoc = dictionaries?.locations?.[depCode];
            const arrLoc = dictionaries?.locations?.[arrCode];

            const depAirport: Airport = {
                code: depCode,
                city: depLoc?.cityCode || depCode, // fallback
                name: depCode, // API search doesn't always return full airport names in dictionaries, just codes
                country: depLoc?.countryCode || ''
            };

            const arrAirport: Airport = {
                code: arrCode,
                city: arrLoc?.cityCode || arrCode,
                name: arrCode,
                country: arrLoc?.countryCode || ''
            };

            return {
                id: offer.id,
                price: priceInUSD,
                currency: 'USD', // Always USD after conversion
                airline: airline,
                flightNumber: `${carrierCode}${firstSegment.number}`,
                departure: {
                    airport: depAirport,
                    at: firstSegment.departure.at
                },
                arrival: {
                    airport: arrAirport,
                    at: lastSegment.arrival.at
                },
                duration: durationMinutes,
                stops: stops,
                segments: [] // Fill if needed for details view
            };
        }));

        return NextResponse.json({ flights });

    } catch (error: any) {
        // Only log detailed errors in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Flight API Error:', error.message);
        }
        
        // Return generic error message in production
        const errorMessage = error.response?.statusCode === 401 
            ? 'Authentication failed' 
            : 'Failed to fetch flights';
        
        return NextResponse.json(
            { error: errorMessage },
            { status: error.response?.statusCode || 500 }
        );
    }
}
