export interface Airport {
    code: string;
    city: string;
    name: string;
    country: string;
}

export interface Airline {
    code: string;
    name: string;
    logo: string;
}

export interface FlightSegment {
    id: string;
    flightNumber: string;
    airline: Airline;
    departure: {
        airport: Airport;
        at: string; // ISO string
        terminal?: string;
    };
    arrival: {
        airport: Airport;
        at: string; // ISO string
        terminal?: string;
    };
    duration: number; // minutes
    aircraft?: string;
    operating?: Airline;
    numberOfStops?: number;
}

export interface FareDetail {
    segmentId: string;
    cabin?: string;
    fareBasis?: string;
    brandedFare?: string;
    class?: string;
    includedCheckedBags?: {
        quantity?: number;
        weight?: number;
        weightUnit?: string;
    };
}

export interface Flight {
    id: string;
    price: number;
    currency: string;
    airline: Airline;
    flightNumber: string;
    departure: {
        airport: Airport;
        at: string; // ISO string
    };
    arrival: {
        airport: Airport;
        at: string; // ISO string
    };
    duration: number; // minutes
    stops: number;
    segments: FlightSegment[];
    fareDetails?: FareDetail[];
    priceBreakdown?: {
        total: number;
        base?: number;
        fees?: { amount: number; type?: string }[];
    };
    originalPrice?: {
        currency: string;
        total: number;
        base?: number;
        fees?: { amount: number; type?: string }[];
    };
    lastTicketingDate?: string;
    numberOfBookableSeats?: number;
    validatingAirlineCodes?: string[];
    instantTicketingRequired?: boolean;
    oneWay?: boolean;
    source?: string;
}

export interface SearchParams {
    origin: string;
    destination: string;
    departureDate: Date | undefined;
    returnDate: Date | undefined;
    passengers: number;
}

export interface FilterState {
    maxPrice: number;
    stops: number[] | null; // null means all, [0] means direct, [1] means 1 stop
    airlines: string[]; // airline codes
    timeRange: 'all' | 'morning' | 'afternoon' | 'evening';
}
