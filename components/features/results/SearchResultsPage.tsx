"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchStore } from "@/store/use-search-store"
import { FilterSidebar } from "./FilterSidebar"
import { PriceChart } from "./PriceChart"
import { FlightList } from "./FlightList"
import { FlightRouteMap } from "./FlightRouteMap"
import { SearchHeader } from "@/components/layout/SearchHeader"
import { InlineSearchForm, InlineSearchFormSkeleton } from "@/components/features/search/InlineSearchForm"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import type { CabinClass } from "@/lib/api/types"

export function SearchResultsPage({
    initialOrigin,
    initialDestination,
    initialDate,
    initialPassengers,
    initialCabinClass
}: {
    initialOrigin?: string,
    initialDestination?: string,
    initialDate?: string,
    initialPassengers?: number,
    initialCabinClass?: CabinClass
}) {
    const setSearchParams = useSearchStore((state) => state.setSearchParams)
    const searchFlights = useSearchStore((state) => state.searchFlights)
    const searchParams = useSearchStore((state) => state.searchParams)
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
            passengers: initialPassengers || 1,
            cabinClass: initialCabinClass || 'Economy'
        })

        // Trigger initial search
        searchFlights()
    }, [initialOrigin, initialDestination, initialDate, initialPassengers, initialCabinClass, setSearchParams, searchFlights])

    if (!mounted) {
        return null
    }

    // Get current display values from store (these update in real-time)
    const displayOrigin = searchParams.origin || initialOrigin
    const displayDestination = searchParams.destination || initialDestination

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50/30 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
            <SearchHeader />

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-125 h-125 rounded-full bg-indigo-100/30 dark:bg-indigo-500/5 blur-3xl" />
                <div className="absolute bottom-[20%] left-[10%] w-100 h-100 rounded-full bg-blue-100/20 dark:bg-blue-500/5 blur-3xl" />
            </div>

            <main className="container mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 relative z-10 space-y-4 sm:space-y-6">
                {/* Inline Search Form - Modify search without going back to homepage */}
                <Suspense fallback={<InlineSearchFormSkeleton />}>
                    <InlineSearchForm />
                </Suspense>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

                    {/* Mobile Filter Button - shown on mobile, hidden on desktop */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full gap-2">
                                    <Filter className="w-4 h-4" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-full sm:w-[400px] p-0">
                                <SheetHeader className="p-4 border-b">
                                    <SheetTitle>Filters</SheetTitle>
                                </SheetHeader>
                                <div className="overflow-y-auto h-[calc(100vh-80px)] p-4">
                                    <FilterSidebar />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Filters Sidebar - hidden on mobile, shown on desktop */}
                    <aside className="hidden lg:block lg:col-span-3 order-2 lg:order-1">
                        <FilterSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-9 order-1 lg:order-2 space-y-4 sm:space-y-6">

                        {/* Flight Route Map Section */}
                        {displayOrigin && displayDestination && (
                            <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white font-display">Flight Route</h2>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{displayOrigin} → {displayDestination}</span>
                                </div>
                                <FlightRouteMap 
                                    origin={displayOrigin} 
                                    destination={displayDestination}
                                    className="h-60 sm:h-80"
                                />
                            </section>
                        )}

                        {/* Price Chart Section */}
                        <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white font-display">Price Overview</h2>
                                <span className="text-xs text-slate-500 dark:text-slate-400">By departure time</span>
                            </div>
                            <div className="h-48 sm:h-64">
                                <PriceChart />
                            </div>
                        </section>

                        {/* Flight List Section */}
                        <section>
                            <FlightList />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
