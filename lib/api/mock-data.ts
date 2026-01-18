import { Flight, Airline, Airport, FlightSegment } from './types';
import { addMinutes, addHours, format, parseISO } from 'date-fns';

const AIRPORTS: Record<string, Airport> = {
    JFK: { code: 'JFK', city: 'New York', name: 'John F. Kennedy International Airport', country: 'USA' },
    LHR: { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'UK' },
    DXB: { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'UAE' },
    HND: { code: 'HND', city: 'Tokyo', name: 'Haneda Airport', country: 'Japan' },
    CDG: { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
    SIN: { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
    LAX: { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport', country: 'USA' },
};

const AIRLINES: Record<string, Airline> = {
    BA: { code: 'BA', name: 'British Airways', logo: 'https://images.kiwi.com/airlines/64/BA.png' },
    AA: { code: 'AA', name: 'American Airlines', logo: 'https://images.kiwi.com/airlines/64/AA.png' },
    EK: { code: 'EK', name: 'Emirates', logo: 'https://images.kiwi.com/airlines/64/EK.png' },
    JL: { code: 'JL', name: 'Japan Airlines', logo: 'https://images.kiwi.com/airlines/64/JL.png' },
    SQ: { code: 'SQ', name: 'Singapore Airlines', logo: 'https://images.kiwi.com/airlines/64/SQ.png' },
    AF: { code: 'AF', name: 'Air France', logo: 'https://images.kiwi.com/airlines/64/AF.png' },
    DL: { code: 'DL', name: 'Delta Air Lines', logo: 'https://images.kiwi.com/airlines/64/DL.png' },
    WS: { code: 'WS', name: 'WestJet', logo: 'https://images.kiwi.com/airlines/64/WS.png' },
    HA: { code: 'HA', name: 'Hawaiian Airlines', logo: 'https://images.kiwi.com/airlines/64/HA.png' },
    AS: { code: 'AS', name: 'Alaska Airlines', logo: 'https://images.kiwi.com/airlines/64/AS.png' },
    F9: { code: 'F9', name: 'Frontier Airlines', logo: 'https://images.kiwi.com/airlines/64/F9.png' },
    B6: { code: 'B6', name: 'JetBlue Airways', logo: 'https://images.kiwi.com/airlines/64/B6.png' },
};

function getAirport(code: string): Airport {
    return AIRPORTS[code] || {
        code,
        city: code,
        name: code,
        country: ''
    };
}

function generateFlight(
    id: string,
    from: string,
    to: string,
    airlineCode: string,
    basePrice: number,
    stops: number,
    departureHour: number
): Flight {
    const airline = AIRLINES[airlineCode];
    const origin = getAirport(from);
    const dest = getAirport(to);

    // Create a base date (tomorrow)
    const today = new Date();
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + 1);
    baseDate.setHours(departureHour, 0, 0, 0);

    const departureTime = baseDate.toISOString();

    // Calculate duration based on route (roughly) + stops
    let duration = 400 + (stops * 120) + (Math.random() * 60); // Base ~7 hours
    const arrivalTime = addMinutes(baseDate, duration).toISOString();

    const airportCodes = Object.keys(AIRPORTS).filter(code => code !== from && code !== to);
    const stopCodes = airportCodes.sort(() => 0.5 - Math.random()).slice(0, stops);
    const route = [from, ...stopCodes, to];
    const segmentDuration = Math.floor(duration / (stops + 1));

    const segments: FlightSegment[] = route.slice(0, -1).map((code, index) => {
        const segAirline = AIRLINES[airlineCode];
        const depAirport = getAirport(route[index]);
        const arrAirport = getAirport(route[index + 1]);
        const segDeparture = addMinutes(baseDate, index * (segmentDuration + 45));
        const segArrival = addMinutes(segDeparture, segmentDuration);

        return {
            id: `${id}-${index + 1}`,
            flightNumber: `${airlineCode}${Math.floor(Math.random() * 900) + 100}`,
            airline: segAirline,
            departure: { airport: depAirport, at: segDeparture.toISOString() },
            arrival: { airport: arrAirport, at: segArrival.toISOString() },
            duration: segmentDuration,
            aircraft: 'A320',
            numberOfStops: 0
        };
    });

    return {
        id,
        price: Math.floor(basePrice + (Math.random() * 100) - 50),
        currency: 'USD',
        airline,
        flightNumber: `${airlineCode}${Math.floor(Math.random() * 900) + 100}`,
        departure: { airport: origin, at: departureTime },
        arrival: { airport: dest, at: arrivalTime },
        duration: Math.floor(duration),
        stops,
        segments,
    };
}

export const MOCK_FLIGHTS: Flight[] = [
    // Direct Flights (Expensive)
    generateFlight('1', 'JFK', 'LHR', 'BA', 850, 0, 18),
    generateFlight('2', 'JFK', 'LHR', 'AA', 820, 0, 19),
    generateFlight('3', 'JFK', 'LHR', 'DL', 880, 0, 21),
    generateFlight('4', 'JFK', 'LHR', 'BA', 900, 0, 0), // Overnight

    // 1 Stop (Cheaper)
    generateFlight('5', 'JFK', 'LHR', 'AF', 550, 1, 14), // Via Paris
    generateFlight('6', 'JFK', 'LHR', 'EK', 1200, 1, 10), // Via Dubai (Expensive detour)
    generateFlight('7', 'JFK', 'LHR', 'AA', 600, 1, 12),

    // 2 Stops (Cheapest usually)
    generateFlight('8', 'JFK', 'LHR', 'SQ', 700, 2, 8),
    generateFlight('9', 'JFK', 'LHR', 'JL', 750, 2, 9),

    // More variety
    generateFlight('10', 'JFK', 'LHR', 'BA', 860, 0, 17),
    generateFlight('11', 'JFK', 'LHR', 'DL', 540, 1, 15),
    generateFlight('12', 'JFK', 'LHR', 'AF', 530, 1, 16),

    // Different destination examples (if needed, but focusing on JFK -> LHR for demo)
];

export const AIRPORT_OPTIONS = Object.values(AIRPORTS);

export function generateMockFlightsForRoute(origin: string, destination: string): Flight[] {
    const airlineCodes = Object.keys(AIRLINES);
    const basePrice = 220 + Math.floor(Math.random() * 150);
    const departures = [6, 9, 12, 15, 18, 21];

    return departures.map((hour, idx) => {
        const airlineCode = airlineCodes[idx % airlineCodes.length];
        const stops = idx % 3;
        return generateFlight(
            `${origin}-${destination}-${idx + 1}`,
            origin,
            destination,
            airlineCode,
            basePrice + idx * 25,
            stops,
            hour
        );
    });
}
