"use client"

import { useEffect, useState } from "react"
import { useSearchStore } from "@/store/use-search-store"
import { FilterSidebar } from "./FilterSidebar"
import { PriceChart } from "./PriceChart"
import { FlightList } from "./FlightList"
import { FlightRouteMap } from "./FlightRouteMap"
import { SearchHeader } from "@/components/layout/SearchHeader"
import { AISearchAssistant } from "@/components/features/search/AISearchAssistant"
import { FlightSearchIntent } from "@/lib/ai-types"

export function SearchResultsPage({
    initialOrigin,
    initialDestination,
    initialDate
}: {
    initialOrigin?: string,
    initialDestination?: string,
    initialDate?: string
}) {
    const setSearchParams = useSearchStore((state) => state.setSearchParams)
    const searchFlights = useSearchStore((state) => state.searchFlights)
    const filteredFlights = useSearchStore((state) => state.filteredFlights)
    const isLoading = useSearchStore((state) => state.isLoading)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // Initialize store with URL params
        setSearchParams({
            origin: initialOrigin || '',
            destination: initialDestination || '',
            departureDate: initialDate ? new Date(initialDate) : undefined,
        })

        // Trigger initial search
        searchFlights()
    }, [initialOrigin, initialDestination, initialDate, setSearchParams, searchFlights])

    if (!mounted) {
        return null
    }

    const handleAIIntent = (intent: FlightSearchIntent) => {
        if (intent.intent !== 'search') return

        setSearchParams({
            origin: intent.origin || '',
            destination: intent.destination || '',
            departureDate: intent.departureDate ? new Date(intent.departureDate) : undefined,
            returnDate: intent.returnDate ? new Date(intent.returnDate) : undefined,
            passengers: intent.adults || 1,
        })

        searchFlights()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
            <SearchHeader />

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-100/30 dark:bg-indigo-500/5 blur-3xl" />
                <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-100/20 dark:bg-blue-500/5 blur-3xl" />
            </div>

            <main className="container mx-auto max-w-7xl px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-3">
                        <FilterSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-9">

                        {/* Results Summary */}
                        {isLoading ? (
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            Searching Flights...
                                        </h1>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {initialOrigin} → {initialDestination}
                                    </p>
                                </div>
                            </div>
                        ) : filteredFlights.length > 0 && (
                            <div className="flex items-center justify-between">
                            </div>
                        )}

                        {/* Flight Route Map Section */}
                        {initialOrigin && initialDestination && (
                            <section className={`${isLoading ? 'mt-6' : ''} bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-md transition-shadow`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Flight Route</h2>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{initialOrigin} → {initialDestination}</span>
                                </div>
                                <FlightRouteMap 
                                    origin={initialOrigin} 
                                    destination={initialDestination}
                                    className="h-96"
                                />
                            </section>
                        )}

                        {/* Price Chart Section */}
                        <section className="mt-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Price Overview</h2>
                                <span className="text-xs text-slate-500 dark:text-slate-400">By departure time</span>
                            </div>
                            <div className="h-72">
                                <PriceChart />
                            </div>
                        </section>

                        {/* Flight List Section */}
                        <section className="mt-6">
                            <FlightList />
                        </section>
                    </div>
                </div>
            </main>

            <AISearchAssistant
                onSearchIntent={handleAIIntent}
                className="fixed bottom-6 right-6 z-50"
            />
        </div>
    )
}
