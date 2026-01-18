"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { 
    Calendar as CalendarIcon, 
    Search, 
    ArrowRightLeft, 
    Users, 
    PlaneTakeoff, 
    PlaneLanding,
    ChevronDown,
    Sparkles,
    X,
    Armchair,
    CircleDot,
    Briefcase,
    Crown,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useSearchStore } from "@/store/use-search-store"
import { LocationInput } from "./LocationInput"
import { Skeleton } from "@/components/ui/skeleton"
import type { CabinClass } from "@/lib/api/types"
import { FlightSearchIntent } from "@/lib/ai-types"

interface InlineSearchFormProps {
    defaultExpanded?: boolean
    onSearchStart?: () => void
    embedded?: boolean  // When true, skips collapsed state and header - used when embedded in navbar dropdown
}

export const InlineSearchForm = React.forwardRef<
    { applyAIIntent: (intent: FlightSearchIntent) => void },
    InlineSearchFormProps
>(({ defaultExpanded = false, onSearchStart, embedded = false }, ref) => {
    const router = useRouter()
    const currentSearchParams = useSearchParams()
    const { searchParams, setSearchParams, searchFlights, isLoading } = useSearchStore()

    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
    
    // Local form state
    const [origin, setOrigin] = React.useState(searchParams.origin || "")
    const [originDisplay, setOriginDisplay] = React.useState(searchParams.origin || "")
    const [destination, setDestination] = React.useState(searchParams.destination || "")
    const [destinationDisplay, setDestinationDisplay] = React.useState(searchParams.destination || "")
    const [date, setDate] = React.useState<Date | undefined>(searchParams.departureDate)
    const [returnDate, setReturnDate] = React.useState<Date | undefined>(searchParams.returnDate)
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
        searchParams.departureDate 
            ? { from: searchParams.departureDate, to: searchParams.returnDate } 
            : undefined
    )
    const [passengers, setPassengers] = React.useState(searchParams.passengers)
    const [tripType, setTripType] = React.useState<"one-way" | "round-trip">(
        searchParams.returnDate ? "round-trip" : "one-way"
    )
    const [cabin, setCabin] = React.useState<CabinClass>(searchParams.cabinClass)
    
    // Pricing calendar state
    const [calendarMonth, setCalendarMonth] = React.useState<Date>(new Date())
    const [priceCalendar, setPriceCalendar] = React.useState<Record<string, number>>({})
    const [priceCalendarLoading, setPriceCalendarLoading] = React.useState(false)
    const [tripDuration, setTripDuration] = React.useState(7)

    // Expose method to parent via ref
    React.useImperativeHandle(ref, () => ({
        applyAIIntent: (intent: FlightSearchIntent) => {
            // Apply origin
            if (intent.origin) {
                setOrigin(intent.origin)
                setOriginDisplay(intent.origin)
            }
            
            // Apply destination
            if (intent.destination) {
                setDestination(intent.destination)
                setDestinationDisplay(intent.destination)
            }
            
            // Apply departure date
            let parsedDepartureDate: Date | undefined
            if (intent.departureDate) {
                try {
                    parsedDepartureDate = new Date(intent.departureDate)
                    if (!isNaN(parsedDepartureDate.getTime())) {
                        setDate(parsedDepartureDate)
                    } else {
                        parsedDepartureDate = undefined
                    }
                } catch {
                    console.error('Invalid departure date:', intent.departureDate)
                }
            }
            
            // Apply return date
            if (intent.returnDate) {
                try {
                    const parsedReturnDate = new Date(intent.returnDate)
                    if (!isNaN(parsedReturnDate.getTime())) {
                        setReturnDate(parsedReturnDate)
                        setTripType('round-trip')
                        // Set date range for the single calendar
                        setDateRange({
                            from: parsedDepartureDate,
                            to: parsedReturnDate
                        })
                    }
                } catch {
                    console.error('Invalid return date:', intent.returnDate)
                }
            } else if (intent.departureDate && !intent.returnDate) {
                setTripType('one-way')
                setReturnDate(undefined)
                setDateRange(parsedDepartureDate ? { from: parsedDepartureDate, to: undefined } : undefined)
            }
            
            // Apply passengers
            if (intent.adults) {
                setPassengers(intent.adults)
            }
            
            // Apply cabin class
            if (intent.travelClass) {
                // Map travelClass to CabinClass type
                const cabinMap: Record<string, CabinClass> = {
                    'ECONOMY': 'Economy',
                    'PREMIUM_ECONOMY': 'Premium Economy',
                    'BUSINESS': 'Business',
                    'FIRST': 'First'
                }
                const mappedCabin = cabinMap[intent.travelClass] || intent.travelClass as CabinClass
                setCabin(mappedCabin)
            }

            // Expand form to show applied changes
            setIsExpanded(true)
        }
    }))

    // Sync from URL params on mount
    React.useEffect(() => {
        const urlOrigin = currentSearchParams.get("origin")
        const urlDestination = currentSearchParams.get("destination")
        const urlDate = currentSearchParams.get("date")
        const urlReturnDate = currentSearchParams.get("returnDate")
        const urlPassengers = currentSearchParams.get("passengers")
        const urlCabin = currentSearchParams.get("cabinClass") as CabinClass | null

        if (urlOrigin) {
            setOrigin(urlOrigin)
            setOriginDisplay(urlOrigin)
        }
        if (urlDestination) {
            setDestination(urlDestination)
            setDestinationDisplay(urlDestination)
        }
        if (urlDate) {
            const parsedDate = new Date(urlDate)
            setDate(parsedDate)
            if (urlReturnDate) {
                const parsedReturn = new Date(urlReturnDate)
                setReturnDate(parsedReturn)
                setDateRange({ from: parsedDate, to: parsedReturn })
                setTripType("round-trip")
            } else {
                setDateRange({ from: parsedDate, to: undefined })
            }
        }
        if (urlPassengers) {
            setPassengers(Number(urlPassengers))
        }
        if (urlCabin) {
            setCabin(urlCabin)
        }
    }, [currentSearchParams])

    // Sync date range
    React.useEffect(() => {
        if (tripType === "round-trip" && dateRange) {
            setDate(dateRange.from)
            setReturnDate(dateRange.to)
        }
    }, [dateRange, tripType])
    
    // Set calendar month when date changes
    React.useEffect(() => {
        if (date) {
            setCalendarMonth(date)
        }
    }, [date])
    
    // Fetch pricing calendar
    React.useEffect(() => {
        if (!origin || !destination) {
            setPriceCalendar({})
            return
        }

        const timeout = window.setTimeout(async () => {
            try {
                setPriceCalendarLoading(true)
                const month = format(calendarMonth, "yyyy-MM")
                const travelClass = cabin === "Premium Economy"
                    ? "PREMIUM_ECONOMY"
                    : cabin === "Business"
                        ? "BUSINESS"
                        : cabin === "First"
                            ? "FIRST"
                            : "ECONOMY"
                            
                const response = await fetch(
                    `/api/prices/calendar?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
                        destination
                    )}&month=${month}&tripType=${tripType}&tripDuration=${tripDuration}&adults=${passengers}&travelClass=${encodeURIComponent(travelClass)}`
                )

                const data = await response.json()
                if (response.ok && data.prices) {
                    setPriceCalendar(data.prices)
                } else {
                    setPriceCalendar({})
                }
            } catch {
                setPriceCalendar({})
            } finally {
                setPriceCalendarLoading(false)
            }
        }, 350)

        return () => window.clearTimeout(timeout)
    }, [origin, destination, calendarMonth, tripType, tripDuration, passengers, cabin])

    const handleSearch = React.useCallback(() => {
        if (!origin || !destination || !date) return

        onSearchStart?.()

        setSearchParams({
            origin,
            destination,
            departureDate: date,
            returnDate: tripType === "round-trip" ? returnDate : undefined,
            passengers,
            cabinClass: cabin
        })

        // Update URL
        const params = new URLSearchParams()
        params.set("origin", origin)
        params.set("destination", destination)
        params.set("date", date.toISOString())
        if (tripType === "round-trip" && returnDate) {
            params.set("returnDate", returnDate.toISOString())
        }
        params.set("passengers", String(passengers))
        params.set("cabinClass", cabin)

        // Update URL without full navigation
        router.replace(`/search?${params.toString()}`, { scroll: false })
        
        // Trigger search
        searchFlights()
        
        // Collapse form after search
        setIsExpanded(false)
    }, [origin, destination, date, returnDate, tripType, passengers, cabin, onSearchStart, setSearchParams, router, searchFlights])

    const handleSwap = () => {
        const tempCode = origin
        const tempDisplay = originDisplay
        setOrigin(destination)
        setOriginDisplay(destinationDisplay)
        setDestination(tempCode)
        setDestinationDisplay(tempDisplay)
    }

    const isValid = origin && destination && date && (tripType === "one-way" || returnDate)

    // Render collapsed state - skip if embedded mode
    if (!isExpanded && !embedded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-200 group"
            >
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Route */}
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-900/30">
                            <PlaneTakeoff className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{origin || "Origin"}</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-900/30">
                            <PlaneLanding className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{destination || "Destination"}</span>
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                            {date ? format(date, "MMM d") : "Select date"}
                            {tripType === "round-trip" && returnDate && (
                                <> – {format(returnDate, "MMM d")}</>
                            )}
                        </span>
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    {/* Passengers & Cabin */}
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                            {passengers} traveler{passengers !== 1 ? "s" : ""}, {cabin}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline">
                        Modify
                    </span>
                    <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
            </button>
        )
    }

    // Render expanded/embedded state
    return (
        <div className={cn(
            embedded 
                ? "" // No wrapper styling when embedded
                : "bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200"
        )}>
            {/* Header with trip type and collapse button - hidden when embedded */}
            {!embedded && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Modify Your Search</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Trip Type Toggle - moved to right side */}
                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                            <button
                                onClick={() => setTripType("round-trip")}
                                className={cn(
                                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                    tripType === "round-trip"
                                        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                Round Trip
                            </button>
                            <button
                                onClick={() => {
                                    setTripType("one-way")
                                    setReturnDate(undefined)
                                    setDateRange(date ? { from: date, to: undefined } : undefined)
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                    tripType === "one-way"
                                        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                One Way
                            </button>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                </div>
            )}

            {/* Trip Type Toggle - shown inline when embedded */}
            {embedded && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <button
                            onClick={() => setTripType("round-trip")}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                tripType === "round-trip"
                                    ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            Round Trip
                        </button>
                        <button
                            onClick={() => {
                                setTripType("one-way")
                                setReturnDate(undefined)
                                setDateRange(date ? { from: date, to: undefined } : undefined)
                            }}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                tripType === "one-way"
                                    ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            One Way
                        </button>
                    </div>
                </div>
            )}

            <div className={cn(embedded ? "" : "p-4", "space-y-4")}>

                {/* Route Section - More compact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                    {/* Origin */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <PlaneTakeoff className="w-3 h-3" />
                            FROM
                        </label>
                        <LocationInput
                            value={origin}
                            displayValue={originDisplay}
                            onChange={setOrigin}
                            onDisplayChange={setOriginDisplay}
                            placeholder="City or airport"
                            label=""
                            icon={null}
                        />
                    </div>

                    {/* Swap Button */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-0.5 z-20 hidden md:flex">
                        <button
                            onClick={handleSwap}
                            className="group p-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-white dark:text-slate-900 group-hover:rotate-180 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Destination */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <PlaneLanding className="w-3 h-3" />
                            TO
                        </label>
                        <LocationInput
                            value={destination}
                            displayValue={destinationDisplay}
                            onChange={setDestination}
                            onDisplayChange={setDestinationDisplay}
                            placeholder="City or airport"
                            label=""
                            icon={null}
                        />
                    </div>
                </div>

                {/* Date, Passengers, Cabin - Compact Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Date Picker */}
                    <div className="sm:col-span-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            <CalendarIcon className="w-3 h-3" />
                            {tripType === "round-trip" ? "DATES" : "DATE"}
                        </label>
                        <Popover>
                            <PopoverTrigger
                                className={cn(
                                    "w-full h-10 px-3 rounded-lg border transition-all duration-200 text-left hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between",
                                    date
                                        ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                )}
                            >
                                <span className={cn(
                                    "text-sm",
                                    date ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"
                                )}>
                                    {tripType === "round-trip" ? (
                                        dateRange?.from ? (
                                            dateRange.to ? (
                                                `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
                                            ) : (
                                                format(dateRange.from, "MMM d, yyyy")
                                            )
                                        ) : (
                                            "Select dates"
                                        )
                                    ) : (
                                        date ? format(date, "MMM d, yyyy") : "Select date"
                                    )}
                                </span>
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                {tripType === "round-trip" ? (
                                    <div className="flex flex-col">
                                        {/* Trip Duration Selector */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                Showing prices for
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setTripDuration(Math.max(1, tripDuration - 1))}
                                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white min-w-20 text-center">
                                                    {tripDuration} day{tripDuration !== 1 ? 's' : ''} trip
                                                </span>
                                                <button
                                                    onClick={() => setTripDuration(Math.min(30, tripDuration + 1))}
                                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={(range) => {
                                                setDateRange(range)
                                                if (range?.from) setDate(range.from)
                                                if (range?.to) setReturnDate(range.to)
                                            }}
                                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                            numberOfMonths={2}
                                            className="p-4 [--cell-size:--spacing(12)]"
                                            month={calendarMonth}
                                            onMonthChange={setCalendarMonth}
                                            prices={origin && destination ? priceCalendar : undefined}
                                            pricesLoading={priceCalendarLoading}
                                        />
                                        
                                        {/* Footer with price summary */}
                                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                            <div className="text-sm">
                                                {dateRange?.from && priceCalendar[format(dateRange.from, 'yyyy-MM-dd')] ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        from ${priceCalendar[format(dateRange.from, 'yyyy-MM-dd')].toLocaleString()}
                                                        <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                                                            round trip
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        {!dateRange?.from 
                                                            ? "Select departure date"
                                                            : !dateRange?.to
                                                                ? "Now select return date"
                                                                : priceCalendarLoading 
                                                                    ? "Loading prices..."
                                                                    : "Select dates to see prices"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                            className="p-4 [--cell-size:--spacing(12)]"
                                            month={calendarMonth}
                                            onMonthChange={setCalendarMonth}
                                            prices={origin && destination ? priceCalendar : undefined}
                                            pricesLoading={priceCalendarLoading}
                                        />
                                        
                                        {/* Footer with price */}
                                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                            <div className="text-sm">
                                                {date && priceCalendar[format(date, 'yyyy-MM-dd')] ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        from ${priceCalendar[format(date, 'yyyy-MM-dd')].toLocaleString()}
                                                        <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                                                            one way
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        {priceCalendarLoading 
                                                            ? "Loading prices…" 
                                                            : origin && destination 
                                                                ? "One-way prices shown"
                                                                : "Select origin & destination"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Passengers */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            <Users className="w-3 h-3" />
                            TRAVELERS
                        </label>
                        <Popover>
                            <PopoverTrigger className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {passengers} {passengers === 1 ? "Passenger" : "Passengers"}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-4" align="start">
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select passengers</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3, 4, 5, 6].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setPassengers(num)}
                                                className={cn(
                                                    "py-2.5 rounded-md text-sm font-medium transition-colors border",
                                                    passengers === num
                                                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                                                        : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                                                )}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Cabin Class */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            <Sparkles className="w-3 h-3" />
                            CLASS
                        </label>
                        <Popover>
                            <PopoverTrigger className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{cabin}</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                                <div className="space-y-2">
                                    {[
                                        { value: "Economy" as CabinClass, icon: Armchair, desc: "Best value" },
                                        { value: "Premium Economy" as CabinClass, icon: CircleDot, desc: "Extra comfort" },
                                        { value: "Business" as CabinClass, icon: Briefcase, desc: "Premium service" },
                                        { value: "First" as CabinClass, icon: Crown, desc: "Ultimate luxury" }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setCabin(option.value)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors border",
                                                cabin === option.value
                                                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <option.icon className={cn(
                                                "w-5 h-5",
                                                cabin === option.value ? "text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400"
                                            )} />
                                            <div className="flex-1">
                                                <div className={cn(
                                                    "font-medium text-sm",
                                                    cabin === option.value ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-white"
                                                )}>{option.value}</div>
                                                <div className={cn(
                                                    "text-xs",
                                                    cabin === option.value ? "text-slate-300 dark:text-slate-600" : "text-slate-500"
                                                )}>
                                                    {option.desc}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Search Button */}
                <Button
                    onClick={handleSearch}
                    disabled={!isValid || isLoading}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-sm"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Searching...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            <span>Search Flights</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    )
})

InlineSearchForm.displayName = 'InlineSearchForm'

// Skeleton loader for the inline search form
export function InlineSearchFormSkeleton() {
    return (
        <div className="w-full px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-5 w-px hidden sm:block" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-px hidden sm:block" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    )
}
