"use client"
import { useSearchStore } from "@/store/use-search-store";
import { Skeleton } from "@/components/ui/skeleton";
import { FlightCard } from "./FlightCard";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Clock, DollarSign, Plane, Search, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { getPriceForSearch } from "@/lib/api/pricing";

type SortOption = 'price' | 'duration' | 'departure' | 'stops';

export function FlightList() {
    const { filteredFlights, isLoading, error, searchParams } = useSearchStore();
    const [sortBy, setSortBy] = useState<SortOption>('price');

    // Sort flights
    const sortedFlights = useMemo(() => {
        const flights = [...filteredFlights];
        switch (sortBy) {
            case 'price':
                return flights.sort((a, b) =>
                    getPriceForSearch(a, searchParams.passengers, searchParams.cabinClass) -
                    getPriceForSearch(b, searchParams.passengers, searchParams.cabinClass)
                );
            case 'duration':
                return flights.sort((a, b) => a.duration - b.duration);
            case 'departure':
                return flights.sort((a, b) => new Date(a.departure.at).getTime() - new Date(b.departure.at).getTime());
            case 'stops':
                return flights.sort((a, b) => a.stops - b.stops);
            default:
                return flights;
        }
    }, [filteredFlights, sortBy]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {/* Loading Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        Finding the best flights for you...
                    </span>
                </div>

                {/* Skeleton Cards */}
                {[1, 2, 3, 4].map((i) => (
                    <div 
                        key={i} 
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 space-y-5"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        {/* Airline Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        
                        {/* Flight Timeline */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-center space-y-1">
                                <Skeleton className="h-7 w-16 mx-auto" />
                                <Skeleton className="h-4 w-12 mx-auto" />
                            </div>
                            
                            <div className="flex-1 flex items-center gap-2">
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                <div className="flex flex-col items-center gap-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Plane className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                            </div>
                            
                            <div className="text-center space-y-1">
                                <Skeleton className="h-7 w-16 mx-auto" />
                                <Skeleton className="h-4 w-12 mx-auto" />
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-10 w-28 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-16 px-8 bg-red-50/80 dark:bg-red-900/10 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-900/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Plane className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2 font-display">Something went wrong</h3>
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
        )
    }

    if (sortedFlights.length === 0) {
        return (
            <div className="text-center py-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">No flights found</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Try adjusting your filters or search criteria</p>
                <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
                    <Plane className="w-4 h-4" />
                    New Search
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <ArrowUpDown className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="font-medium">Sort by</span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Button
                        variant={sortBy === 'price' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('price')}
                        className={sortBy === 'price' ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-xs sm:text-sm' : 'border-slate-200 dark:border-slate-700 text-xs sm:text-sm'}
                    >
                        <DollarSign className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
                        Price
                    </Button>
                    <Button
                        variant={sortBy === 'duration' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('duration')}
                        className={sortBy === 'duration' ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-xs sm:text-sm' : 'border-slate-200 dark:border-slate-700 text-xs sm:text-sm'}
                    >
                        <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
                        Duration
                    </Button>
                    <Button
                        variant={sortBy === 'departure' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('departure')}
                        className={sortBy === 'departure' ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-xs sm:text-sm' : 'border-slate-200 dark:border-slate-700 text-xs sm:text-sm'}
                    >
                        <Plane className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
                        <span className="hidden sm:inline">Departure</span>
                        <span className="sm:hidden">Depart</span>
                    </Button>
                    <Button
                        variant={sortBy === 'stops' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('stops')}
                        className={sortBy === 'stops' ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-xs sm:text-sm' : 'border-slate-200 dark:border-slate-700 text-xs sm:text-sm'}
                    >
                        <span className="hidden sm:inline">Direct First</span>
                        <span className="sm:hidden">Stops</span>
                    </Button>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto text-center sm:text-left">
                    <strong className="text-slate-900 dark:text-white">{sortedFlights.length}</strong> result{sortedFlights.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Flight Cards */}
            <div className="space-y-3 sm:space-y-4">
                {sortedFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                ))}
            </div>
        </div>
    )
}
