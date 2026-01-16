"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar as CalendarIcon, MapPin, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchStore } from "@/store/use-search-store"
import { AIRPORT_OPTIONS } from "@/lib/api/mock-data"
import { LocationPicker } from "./LocationPicker"
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
    ComboboxTrigger,
    ComboboxValue
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"

export function SearchForm() {
    const router = useRouter()
    const { setSearchParams } = useSearchStore()

    const [origin, setOrigin] = React.useState<string>("")
    const [destination, setDestination] = React.useState<string>("")
    const [date, setDate] = React.useState<Date | undefined>(undefined)

    // Handlers for Combobox changes
    // Note: Base UI combobox might behave differently, assume value change handler on Root or Item select
    // Looking at the file, Combobox is ComboboxPrimitive.Root

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault() // If wrapped in form, but we might just use button click

        if (!origin || !destination || !date) {
            // Simple validation visualization could be added here
            return
        }

        setSearchParams({
            origin,
            destination,
            departureDate: date,
            returnDate: undefined,
            passengers: 1
        })

        const params = new URLSearchParams()
        params.set("origin", origin)
        params.set("destination", destination)
        params.set("date", date.toISOString())

        router.push(`/search?${params.toString()}`)
    }

    const isValid = origin && destination && date;

    return (
        <Card className="w-full max-w-4xl border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-visible">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-display">
                    <Search className="w-5 h-5 text-indigo-600" />
                    Find your next flight
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                    {/* Origin */}
                    <LocationPicker
                        label="From"
                        value={origin}
                        onChange={setOrigin}
                        placeholder="City or Airport"
                    />

                    {/* Destination */}
                    <LocationPicker
                        label="To"
                        value={destination}
                        onChange={setDestination}
                        placeholder="City or Airport"
                    />

                    {/* Date */}
                    <div className="md:col-span-3 space-y-2">
                        <Label>Departure</Label>
                        <Popover>
                            <PopoverTrigger
                                className={cn(
                                    "w-full justify-start text-left font-normal inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) =>
                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Search Button */}
                    <div className="md:col-span-3">
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg hover:shadow-indigo-500/30"
                            size="lg"
                            onClick={handleSearch}
                            disabled={!isValid}
                        >
                            Search Flights
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
