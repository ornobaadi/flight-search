"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Search, ArrowRightLeft, Users, Plane, PlaneTakeoff, PlaneLanding, Sparkles, Armchair, CircleDot, Briefcase, Crown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useSearchStore } from "@/store/use-search-store"
import { LocationInput } from "./LocationInput"
import { Separator } from "@/components/ui/separator"
import { FlightSearchIntent } from "@/lib/openrouter-client"

export interface FlightSearchFormRef {
    applyAIIntent: (intent: FlightSearchIntent) => void;
}

export const FlightSearchForm = React.forwardRef<FlightSearchFormRef, {}>(function FlightSearchForm(_props, ref) {
    const router = useRouter()
    const { setSearchParams } = useSearchStore()

    const [origin, setOrigin] = React.useState<string>("")
    const [originDisplay, setOriginDisplay] = React.useState<string>("")
    const [destination, setDestination] = React.useState<string>("")
    const [destinationDisplay, setDestinationDisplay] = React.useState<string>("")
    const [date, setDate] = React.useState<Date | undefined>(undefined)
    const [returnDate, setReturnDate] = React.useState<Date | undefined>(undefined)

    const [passengers, setPassengers] = React.useState(1)
    const [tripType, setTripType] = React.useState<"one-way" | "round-trip">("round-trip")
    const [cabin, setCabin] = React.useState<"Economy" | "Premium Economy" | "Business" | "First">("Economy")

    const handleSearch = () => {
        if (!origin || !destination || !date) return

        setSearchParams({
            origin,
            destination,
            departureDate: date,
            returnDate: tripType === "round-trip" ? returnDate : undefined,
            passengers
        })

        const params = new URLSearchParams()
        params.set("origin", origin)
        params.set("destination", destination)
        params.set("date", date.toISOString())
        if (tripType === "round-trip" && returnDate) {
            params.set("returnDate", returnDate.toISOString())
        }

        router.push(`/search?${params.toString()}`)
    }

    const isValid = origin && destination && date && (tripType === "one-way" || returnDate);

    const handleSwap = () => {
        const tempCode = origin
        const tempDisplay = originDisplay
        setOrigin(destination)
        setOriginDisplay(destinationDisplay)
        setDestination(tempCode)
        setDestinationDisplay(tempDisplay)
    }

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
            if (intent.departureDate) {
                try {
                    const parsedDate = new Date(intent.departureDate)
                    if (!isNaN(parsedDate.getTime())) {
                        setDate(parsedDate)
                    }
                } catch (e) {
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
                    }
                } catch (e) {
                    console.error('Invalid return date:', intent.returnDate)
                }
            } else if (intent.departureDate && !intent.returnDate) {
                setTripType('one-way')
            }
            
            // Apply passengers
            if (intent.adults && intent.adults >= 1 && intent.adults <= 6) {
                setPassengers(intent.adults)
            }
            
            // Apply travel class
            if (intent.travelClass) {
                const classMap: Record<string, typeof cabin> = {
                    'ECONOMY': 'Economy',
                    'PREMIUM_ECONOMY': 'Premium Economy',
                    'BUSINESS': 'Business',
                    'FIRST': 'First'
                }
                const mappedClass = classMap[intent.travelClass]
                if (mappedClass) {
                    setCabin(mappedClass)
                }
            }

            // Smooth scroll to form
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }))

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="relative">
                {/* Main card */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg dark:shadow-indigo-900/10 p-8 space-y-8">
                    
                    {/* Header with trip options */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-sm">
                                <Plane className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Book Your Flight
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Find the best deals for your journey</p>
                            </div>
                        </div>
                        
                        {/* Trip Type Selector - Pill Style */}
                        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
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
                                onClick={() => setTripType("one-way")}
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

                    <Separator />

                    {/* Flight Route Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                            {/* Origin */}
                            <div className="relative group/input">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 ml-1">
                                    <PlaneTakeoff className="w-3.5 h-3.5" />
                                    DEPARTURE FROM
                                </label>
                                <div className="relative">
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
                            </div>

                            {/* Swap Button - Centered between cards */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex">
                                <button
                                    onClick={handleSwap}
                                    className="group p-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <ArrowRightLeft className="w-4 h-4 text-white dark:text-slate-900 group-hover:rotate-180 transition-transform duration-300" />
                                </button>
                            </div>

                            {/* Destination */}
                            <div className="relative group/input">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 ml-1">
                                    <PlaneLanding className="w-3.5 h-3.5" />
                                    ARRIVAL AT
                                </label>
                                <div className="relative">
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
                        </div>

                        {/* Dates Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Departure Date */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    DEPARTURE DATE
                                </label>
                                <Popover>
                                    <PopoverTrigger
                                        className={cn(
                                                "w-full h-16 px-5 rounded-lg border transition-all duration-200 text-left hover:bg-slate-50 dark:hover:bg-slate-900",
                                                date
                                                    ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {date ? (
                                                    <>
                                                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                                                            {format(date, "MMM d, yyyy")}
                                                        </span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                            {format(date, "EEEE")}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500">Select date</span>
                                                )}
                                            </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Return Date */}
                            {tripType === "round-trip" && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        RETURN DATE
                                    </label>
                                    <Popover>
                                        <PopoverTrigger
                                            className={cn(
                                                    "w-full h-16 px-5 rounded-lg border transition-all duration-200 text-left hover:bg-slate-50 dark:hover:bg-slate-900",
                                                    returnDate
                                                        ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    {returnDate ? (
                                                        <>
                                                            <span className="text-lg font-semibold text-slate-900 dark:text-white">
                                                                {format(returnDate, "MMM d, yyyy")}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                                {format(returnDate, "EEEE")}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500">Select date</span>
                                                    )}
                                                </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={returnDate}
                                                onSelect={setReturnDate}
                                                disabled={(d) => d < (date || new Date())}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Passengers & Cabin */}
                    <div className="flex flex-wrap gap-3">
                        <Popover>
                            <PopoverTrigger className="flex items-center gap-3 px-5 py-3 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
                                    <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Travelers</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {passengers} {passengers === 1 ? "Passenger" : "Passengers"}
                                        </span>
                                    </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-4" align="start">
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select passengers</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3, 4, 5, 6].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setPassengers(num)}
                                                className={cn(
                                                    "py-3 rounded-md text-sm font-medium transition-colors border",
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

                        <Popover>
                            <PopoverTrigger className="flex items-center gap-3 px-5 py-3 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
                                <Sparkles className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Class</span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{cabin}</span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                                <div className="space-y-2">
                                    {[
                                        { value: "Economy", icon: Armchair, desc: "Best value" },
                                        { value: "Premium Economy", icon: CircleDot, desc: "Extra comfort" },
                                        { value: "Business", icon: Briefcase, desc: "Premium service" },
                                        { value: "First", icon: Crown, desc: "Ultimate luxury" }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setCabin(option.value as typeof cabin)}
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
                                                    cabin === option.value ? "text-slate-300 dark:text-slate-700" : "text-slate-500"
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

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={!isValid}
                        className={cn(
                            "w-full h-14 rounded-lg font-semibold text-base transition-colors flex items-center justify-center gap-2",
                            isValid
                                ? "bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                                : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800"
                        )}
                    >
                        <Search className="w-5 h-5" />
                        <span>Search Flights</span>
                    </button>
                </div>
            </div>
        </div>
    )
})
