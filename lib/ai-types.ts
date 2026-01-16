export interface FlightSearchIntent {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    adults?: number;
    travelClass?: string;
    intent?: 'search' | 'explore' | 'recommend';
    preferences?: string[];
}
