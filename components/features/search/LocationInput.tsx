"use client"

import * as React from "react"
import { Check, Plane, MapPin, Loader2, ChevronDown, Globe } from "lucide-react"
import { useDebounce } from "use-debounce"

import { cn } from "@/lib/utils"

interface Location {
    code: string;
    name: string;
    city: string;
    country: string;
    countryCode?: string;
    type: string;
}

interface LocationInputProps {
    value: string
    onChange: (value: string) => void
    onSelect?: (location: Location) => void
    displayValue?: string
    onDisplayChange?: (display: string) => void
    placeholder?: string
    icon?: React.ReactNode
    label?: string
    className?: string
}

export function LocationInput({ value, onChange, onSelect, displayValue, onDisplayChange, placeholder, icon, label, className }: LocationInputProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [debouncedInput] = useDebounce(inputValue, 300)
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<Location[]>([])
    const [expandedCountries, setExpandedCountries] = React.useState<Set<string>>(new Set())
    const [relevanceScores, setRelevanceScores] = React.useState<Record<string, number>>({})
    const [aiInsight, setAiInsight] = React.useState<any>(null)
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const inputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [popularAirports] = React.useState<Location[]>([
        { code: 'JFK', name: 'John F Kennedy International Airport', city: 'New York', country: 'United States', type: 'AIRPORT' },
        { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', type: 'AIRPORT' },
        { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', type: 'AIRPORT' },
        { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', type: 'AIRPORT' },
    ])

    // Group results by country
    const groupedResults = React.useMemo(() => {
        const grouped: Record<string, Location[]> = {}
        results.forEach((loc) => {
            if (!grouped[loc.country]) {
                grouped[loc.country] = []
            }
            grouped[loc.country].push(loc)
        })
        return grouped
    }, [results])

    // Fetch results when debounced input changes
    React.useEffect(() => {
        async function fetchLocations() {
            if (!debouncedInput || debouncedInput.length < 2) {
                setResults([])
                setExpandedCountries(new Set())
                setRelevanceScores({})
                setAiInsight(null)
                setSuggestions([])
                return
            }

            setLoading(true)
            try {
                // Use AI-powered smart search
                const res = await fetch(`/api/locations/smart?keyword=${encodeURIComponent(debouncedInput)}`)
                const data = await res.json()
                setResults(data.locations || [])
                setSuggestions(data.suggestions || [])
                setAiInsight(data.aiInsight)
                
                // Auto-expand based on AI detection
                if (data.locations && data.locations.length > 0) {
                    const countriesToExpand = new Set<string>()
                    
                    // If AI detected a country with high confidence, expand it
                    if (data.aiInsight?.detectedType === 'country' && data.aiInsight.confidence > 0.7) {
                        const detectedCountry = data.aiInsight.detectedCountry
                        if (detectedCountry) {
                            countriesToExpand.add(detectedCountry)
                        }
                    }
                    
                    // If AI detected a city, expand that country
                    if (data.aiInsight?.detectedType === 'city' && data.aiInsight.detectedCountry) {
                        countriesToExpand.add(data.aiInsight.detectedCountry)
                    }
                    
                    // If no AI insights, expand first country
                    if (countriesToExpand.size === 0) {
                        const firstCountry = data.locations[0]?.country
                        if (firstCountry) {
                            countriesToExpand.add(firstCountry)
                        }
                    }
                    
                    setExpandedCountries(countriesToExpand)
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Failed to fetch locations", error)
                }
                setResults([])
                setExpandedCountries(new Set())
                setRelevanceScores({})
                setAiInsight(null)
                setSuggestions([])
            } finally {
                setLoading(false)
            }
        }

        if (open) {
            fetchLocations()
        }
    }, [debouncedInput, open])

    const handleSelect = (location: Location) => {
        onChange(location.code)
        if (onDisplayChange) {
            onDisplayChange(`${location.city}`)
        }
        if (onSelect) {
            onSelect(location)
        }
        setOpen(false)
        setInputValue("")
        setExpandedCountries(new Set())
    }

    const toggleCountry = (country: string) => {
        setExpandedCountries(prev => {
            const next = new Set(prev)
            if (next.has(country)) {
                next.delete(country)
            } else {
                next.add(country)
            }
            return next
        })
    }

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
        }
    }

    // Get display text for the input
    const getInputDisplayValue = () => {
        if (inputValue) return inputValue
        if (value && displayValue) return displayValue
        return ""
    }

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Input Field */}
            <div
                onClick={() => inputRef.current?.focus()}
                className={cn(
                    "flex items-center gap-3 w-full h-16 px-5 rounded-lg border transition-all cursor-text",
                    "hover:bg-slate-50 dark:hover:bg-slate-900",
                    value && displayValue && !inputValue
                        ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
                    open && "ring-0 ring-violet-500 border-violet-500"
                )}
            >
                <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder || "City or airport"}
                        value={getInputDisplayValue()}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            if (!open) setOpen(true)
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        className="w-full text-base font-medium text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-400 placeholder:font-normal"
                        autoComplete="off"
                    />
                    {value && !inputValue && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {value}
                        </span>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="max-h-[320px] overflow-y-auto p-2">
                            {/* AI Insights - Clean & Minimal */}
                            {!loading && aiInsight && aiInsight.confidence > 0.7 && (
                                <div className="mx-2 mb-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                        <span className="font-medium">
                                            {aiInsight.detectedType === 'country' ? '🌍' : aiInsight.detectedType === 'city' ? '📍' : '✈️'}
                                        </span>
                                        <span>{suggestions[0]}</span>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="py-8 flex justify-center items-center text-sm text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    <span>Searching...</span>
                                </div>
                            )}

                            {!loading && results.length === 0 && debouncedInput.length < 2 && (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        Popular Destinations
                                    </div>
                                    {popularAirports.map((loc) => (
                                        <button
                                            key={`${loc.code}-popular`}
                                            onClick={() => handleSelect(loc)}
                                            className="flex items-center gap-3 py-3 px-3 w-full hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-900 dark:group-hover:bg-slate-700 transition-colors">
                                                <Plane className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{loc.city}</span>
                                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">({loc.code})</span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{loc.name}</div>
                                            </div>
                                            {value === loc.code && (
                                                <Check className="w-4 h-4 text-slate-900 dark:text-slate-100 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!loading && results.length === 0 && debouncedInput.length >= 2 && (
                                <div className="py-8 text-center text-sm text-slate-500">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Globe className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="mb-2 font-medium">No results found</div>
                                    <div className="text-xs text-slate-400">
                                        Try searching for:
                                        <div className="mt-2 space-y-1">
                                            <div>• Country (e.g., "India", "Japan")</div>
                                            <div>• City (e.g., "Mumbai", "Tokyo")</div>
                                            <div>• Airport code (e.g., "DEL", "NRT")</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!loading && results.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center justify-between">
                                        <span>Search Results</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{results.length} found</span>
                                    </div>
                                    
                                    {Object.entries(groupedResults).map(([country, locations]) => {
                                        // Check if this country matches AI detection
                                        const isAIDetected = aiInsight?.detectedCountry?.toLowerCase() === country.toLowerCase()
                                        const isHighlyRelevant = isAIDetected || (relevanceScores[country] || 0) >= 500
                                        
                                        return (
                                            <div key={country} className="space-y-0.5">
                                            {/* Country Header - Clickable to expand/collapse */}
                                            <button
                                                onClick={() => toggleCountry(country)}
                                                className={cn(
                                                    "flex items-center gap-2 py-2.5 px-3 w-full rounded-lg transition-colors group",
                                                    isHighlyRelevant 
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" 
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-900"
                                                )}
                                            >
                                                <Globe className={cn(
                                                    "w-4 h-4",
                                                    isHighlyRelevant 
                                                        ? "text-emerald-600 dark:text-emerald-400" 
                                                        : "text-slate-400 dark:text-slate-500"
                                                )} />
                                                <span className={cn(
                                                    "font-semibold text-sm flex-1 text-left",
                                                    isHighlyRelevant 
                                                        ? "text-emerald-900 dark:text-emerald-100" 
                                                        : "text-slate-900 dark:text-slate-100"
                                                )}>
                                                    {country}
                                                    {isHighlyRelevant && (
                                                        <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-400">✓ Best match</span>
                                                    )}
                                                </span>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full",
                                                    isHighlyRelevant
                                                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                                )}>
                                                    {locations.length} {locations.length === 1 ? 'airport' : 'airports'}
                                                </span>
                                                <ChevronDown className={cn(
                                                    "w-4 h-4 transition-transform",
                                                    isHighlyRelevant ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400",
                                                    expandedCountries.has(country) && "rotate-180"
                                                )} />
                                            </button>
                                            
                                            {/* Airports/Cities in this country */}
                                            {expandedCountries.has(country) && (
                                                <div className="ml-6 space-y-0.5">
                                                    {locations.map((loc) => (
                                                        <button
                                                            key={`${loc.code}-${loc.type}`}
                                                            onClick={() => handleSelect(loc)}
                                                            className="flex items-center gap-3 py-3 px-3 w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors group"
                                                        >
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-emerald-600 dark:group-hover:bg-emerald-600 transition-colors">
                                                                {loc.type === 'CITY' ? 
                                                                    <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" /> : 
                                                                    <Plane className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
                                                                }
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0 text-left">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{loc.city}</span>
                                                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">({loc.code})</span>
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{loc.name}</div>
                                                            </div>
                                                            {value === loc.code && (
                                                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
