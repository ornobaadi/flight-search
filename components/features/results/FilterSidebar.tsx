"use client"
import { useSearchStore } from "@/store/use-search-store";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export function FilterSidebar() {
    const { filters, setFilter, resetFilters, allFlights, isLoading } = useSearchStore();

    // Dynamically extract unique airlines from actual flight data
    const AIRLINES = useMemo(() => {
        const airlineMap = new Map();
        allFlights.forEach(flight => {
            if (!airlineMap.has(flight.airline.code)) {
                airlineMap.set(flight.airline.code, {
                    id: flight.airline.code,
                    label: flight.airline.name,
                    count: 1
                });
            } else {
                const airline = airlineMap.get(flight.airline.code);
                airline.count++;
            }
        });
        return Array.from(airlineMap.values()).sort((a, b) => b.count - a.count);
    }, [allFlights]);

    // Calculate price range from actual data
    const priceRange = useMemo(() => {
        if (allFlights.length === 0) return { min: 0, max: 3000 };
        const prices = allFlights.map(f => f.price);
        return {
            min: Math.floor(Math.min(...prices)),
            max: Math.ceil(Math.max(...prices))
        };
    }, [allFlights]);

    if (isLoading) {
        return (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sticky top-20 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-12" />
                </div>
                
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-full" />
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-5 w-28" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-5 w-20" />
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sticky top-20 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white font-display">Filters</h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters} 
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 h-auto p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md font-medium text-sm"
                >
                    Reset
                </Button>
            </div>

            {/* Results Count */}
            <div className="text-sm text-slate-600 dark:text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-medium text-slate-900 dark:text-white">{allFlights.length}</span> flights available
            </div>

            {/* Price */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="font-medium text-slate-700 dark:text-slate-300 text-sm">Max Price</Label>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${filters.maxPrice}</span>
                </div>
                <Slider
                    value={[filters.maxPrice]}
                    min={priceRange.min}
                    max={priceRange.max}
                    step={10}
                    onValueChange={(val) => setFilter('maxPrice', Array.isArray(val) ? val[0] : val)}
                    className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>${priceRange.min}</span>
                    <span>${priceRange.max}</span>
                </div>
            </div>

            {/* Stops */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <Label className="font-medium text-slate-700 dark:text-slate-300 text-sm">Number of Stops</Label>
                <div className="space-y-2">
                    {[
                        { val: 0, label: "Nonstop" },
                        { val: 1, label: "1 Stop" },
                        { val: 2, label: "2+ Stops" }
                    ].map((opt) => (
                        <div key={opt.val} className="flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2.5 rounded-lg transition-colors cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={`stop-${opt.val}`}
                                    checked={filters.stops === null || filters.stops.includes(opt.val)}
                                    onCheckedChange={(checked) => {
                                        const current = filters.stops || [0, 1, 2];
                                        let next;
                                        if (checked) {
                                            next = [...current, opt.val];
                                        } else {
                                            next = current.filter(s => s !== opt.val);
                                        }
                                        setFilter('stops', next.length === 3 ? null : next);
                                    }}
                                />
                                <Label htmlFor={`stop-${opt.val}`} className="font-normal cursor-pointer text-sm">{opt.label}</Label>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-medium">
                                {allFlights.filter(f => opt.val === 2 ? f.stops >= 2 : f.stops === opt.val).length}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Airlines */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <Label className="font-medium text-slate-700 dark:text-slate-300 text-sm">Airlines</Label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2 -mr-2 scrollbar-thin">
                    {AIRLINES.length === 0 ? (
                        <div className="text-sm text-slate-400 dark:text-slate-500 py-2">No airlines available</div>
                    ) : (
                        AIRLINES.map((airline) => (
                            <div key={airline.id} className="flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2.5 rounded-lg transition-colors cursor-pointer">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <Checkbox
                                        id={`al-${airline.id}`}
                                        checked={filters.airlines.length === 0 || filters.airlines.includes(airline.id)}
                                        onCheckedChange={(checked) => {
                                            const current = filters.airlines;
                                            let next;
                                            if (current.includes(airline.id)) {
                                                next = current.filter(id => id !== airline.id)
                                            } else {
                                                next = [...current, airline.id]
                                            }
                                            setFilter('airlines', next);
                                        }}
                                    />
                                    <Label htmlFor={`al-${airline.id}`} className="font-normal cursor-pointer truncate flex-1 text-sm">{airline.label}</Label>
                                </div>
                                <span className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 font-medium">
                                    {airline.count}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
