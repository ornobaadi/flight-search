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

export type CabinClass = "Economy" | "Premium Economy" | "Business" | "First";

export interface SearchParams {
    origin: string;
    destination: string;
    departureDate: Date | undefined;
    returnDate: Date | undefined;
    passengers: number;
    cabinClass: CabinClass;
}

export interface FilterState {
    maxPrice: number;
    stops: number[] | null; // null means all, [0] means direct, [1] means 1 stop
    airlines: string[]; // airline codes
    timeRange: 'all' | 'morning' | 'afternoon' | 'evening';
}

export interface BookingProvider {
    id: string;
    name: string;
    logo?: string;
    price: number;
    currency: string;
    url: string;
    type: "airline" | "ota"; // Online Travel Agency
    benefits?: string[];
    isBestPrice?: boolean;
    searchParams?: {
        origin: string;
        destination: string;
        date: string;
    };
}
