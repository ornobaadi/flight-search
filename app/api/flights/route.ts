import { NextResponse } from 'next/server';
import { amadeus } from '@/lib/amadeus-client';
import { Flight, Airline, Airport, FareDetail, FlightSegment } from '@/lib/api/types';
import { format } from 'date-fns';
import { convertToUSD } from '@/lib/currency-converter';
import { generateMockFlightsForRoute } from '@/lib/api/mock-data';

// Helper to look up airline names (Mock/Hardcoded mostly as API returns codes, 
// though Dictionaries in response contain them, we'll try to use that)
const getAirlineLogo = (code: string) => {
    // Custom logos for specific airlines where CDNs don't work well
    const customLogos: Record<string, string> = {
        'WS': 'https://static.wikia.nocookie.net/logopedia/images/c/c2/WestJet_Icon2018.svg/revision/latest?cb=20190812235332',
        'HA': 'https://toppng.com/uploads/preview/hawaiian-airlines-logo-vector-11573935919tgavoyo0wb.png',
        'AS': 'https://brandlogos.net/wp-content/uploads/2021/11/alaska_airlines-logo.png',
        // Add more custom logos as needed
    };
    
    // Try custom logos first, then fallback to FlightAware CDN (most reliable for airline logos)
    return customLogos[code] || `https://images.kiwi.com/airlines/64/${code}.png`;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const adults = searchParams.get('adults') || '1';
    const travelClass = searchParams.get('travelClass') || undefined;

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
            adults,
            ...(travelClass ? { travelClass } : {}),
            max: '20'
        });

        const data = response.data; // The flight offers
        const dictionaries = response.result?.dictionaries; // Lookup tables for codes

        if (!data || data.length === 0) {
            const mockFlights = generateMockFlightsForRoute(origin, destination);
            return NextResponse.json({ flights: mockFlights });
        }

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
                if (!pt) return 0;
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

            const originalBase = offer.price.base ? parseFloat(offer.price.base) : undefined;
            const originalFees = Array.isArray(offer.price.fees)
                ? offer.price.fees.map((fee: any) => ({
                    amount: parseFloat(fee.amount),
                    type: fee.type
                }))
                : undefined;

            const priceBreakdown = {
                total: priceInUSD,
                base: originalBase ? await convertToUSD(originalBase, originalCurrency) : undefined,
                fees: originalFees
                    ? await Promise.all(originalFees.map(async (fee: { amount: number; type?: string }) => ({
                        amount: await convertToUSD(fee.amount, originalCurrency),
                        type: fee.type
                    })))
                    : undefined
            };

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

            const flightSegments: FlightSegment[] = segments.map((segment: any) => {
                const segDepCode = segment.departure.iataCode;
                const segArrCode = segment.arrival.iataCode;
                const segDepLoc = dictionaries?.locations?.[segDepCode];
                const segArrLoc = dictionaries?.locations?.[segArrCode];
                const segCarrier = segment.carrierCode;
                const segCarrierName = dictionaries?.carriers?.[segCarrier] || segCarrier;
                const operatingCarrier = segment.operating?.carrierCode;
                const operatingName = operatingCarrier ? dictionaries?.carriers?.[operatingCarrier] || operatingCarrier : undefined;

                return {
                    id: segment.id,
                    flightNumber: `${segCarrier}${segment.number}`,
                    airline: {
                        code: segCarrier,
                        name: segCarrierName,
                        logo: getAirlineLogo(segCarrier)
                    },
                    departure: {
                        airport: {
                            code: segDepCode,
                            city: segDepLoc?.cityCode || segDepCode,
                            name: segDepCode,
                            country: segDepLoc?.countryCode || ''
                        },
                        at: segment.departure.at,
                        terminal: segment.departure.terminal
                    },
                    arrival: {
                        airport: {
                            code: segArrCode,
                            city: segArrLoc?.cityCode || segArrCode,
                            name: segArrCode,
                            country: segArrLoc?.countryCode || ''
                        },
                        at: segment.arrival.at,
                        terminal: segment.arrival.terminal
                    },
                    duration: parseDuration(segment.duration),
                    aircraft: segment.aircraft?.code ? (dictionaries?.aircraft?.[segment.aircraft.code] || segment.aircraft.code) : undefined,
                    operating: operatingCarrier ? {
                        code: operatingCarrier,
                        name: operatingName || operatingCarrier,
                        logo: getAirlineLogo(operatingCarrier)
                    } : undefined,
                    numberOfStops: segment.numberOfStops
                };
            });

            const fareDetails: FareDetail[] | undefined = offer.travelerPricings?.[0]?.fareDetailsBySegment
                ? offer.travelerPricings[0].fareDetailsBySegment.map((detail: any) => ({
                    segmentId: detail.segmentId,
                    cabin: detail.cabin,
                    fareBasis: detail.fareBasis,
                    brandedFare: detail.brandedFare,
                    class: detail.class,
                    includedCheckedBags: detail.includedCheckedBags
                }))
                : undefined;

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
                segments: flightSegments,
                fareDetails,
                priceBreakdown,
                originalPrice: {
                    currency: originalCurrency,
                    total: originalPrice,
                    base: originalBase,
                    fees: originalFees
                },
                lastTicketingDate: offer.lastTicketingDate,
                numberOfBookableSeats: offer.numberOfBookableSeats,
                validatingAirlineCodes: offer.validatingAirlineCodes,
                instantTicketingRequired: offer.instantTicketingRequired,
                oneWay: offer.oneWay,
                source: offer.source
            };
        }));

        return NextResponse.json({ flights });

    } catch (error: any) {
        // Only log detailed errors in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Flight API Error:', error.message);
        }

        const mockFlights = origin && destination
            ? generateMockFlightsForRoute(origin, destination)
            : [];

        if (mockFlights.length > 0) {
            return NextResponse.json({ flights: mockFlights });
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
