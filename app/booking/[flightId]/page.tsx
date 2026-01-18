"use client"

import { useParams, useRouter } from "next/navigation";
import { useSearchStore } from "@/store/use-search-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { FlightDetails } from "@/components/features/results/FlightDetails";
import { BookingOptions } from "@/components/features/results/BookingOptions";

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { allFlights, searchParams } = useSearchStore();
    
    const flightId = params.flightId as string;
    const flight = allFlights.find(f => f.id === flightId);

    if (!flight) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50/30 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
                <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.back()}
                        className="mb-3"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to results
                    </Button>
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Flight not found
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            The flight you&apos;re looking for doesn&apos;t exist or has been removed.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50/30 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
            <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4">
                {/* Back Button */}
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="mb-3 hover:bg-white/50 dark:hover:bg-slate-800/50"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to results
                </Button>

                {/* Page Header */}
                <div className="mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {flight.departure.airport.city} → {flight.arrival.airport.city}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''} · {searchParams.cabinClass}
                    </p>
                </div>

                {/* Flight Details */}
                <FlightDetails flight={flight} searchParams={searchParams} />

                {/* Booking Options */}
                <BookingOptions flight={flight} searchParams={searchParams} />
            </div>
        </div>
    );
}
