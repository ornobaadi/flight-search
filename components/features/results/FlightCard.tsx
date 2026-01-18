"use client"

import { Flight } from "@/lib/api/types";
import { format, differenceInMinutes } from "date-fns";
import { ChevronDown, Plane, Clock, Circle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import Image from "next/image";
import { useSearchStore } from "@/store/use-search-store";
import { getPriceForSearch } from "@/lib/api/pricing";
import { useRouter } from "next/navigation";

export function FlightCard({ flight }: { flight: Flight }) {
    const [expanded, setExpanded] = useState(false);
    const { searchParams } = useSearchStore();
    const router = useRouter();

    // Duration formatter
    const hours = Math.floor(flight.duration / 60);
    const minutes = flight.duration % 60;
    const durationString = `${hours}h ${minutes}m`;

    // Calculate if next day arrival
    const depDate = new Date(flight.departure.at);
    const arrDate = new Date(flight.arrival.at);
    const isNextDay = depDate.getDate() !== arrDate.getDate();

    const effectivePrice = getPriceForSearch(
        flight,
        searchParams.passengers,
        searchParams.cabinClass
    );
    const perPassengerPrice = effectivePrice / Math.max(searchParams.passengers, 1);

    const hasDetails = Boolean(
        (flight.segments && flight.segments.length > 0) ||
        (flight.fareDetails && flight.fareDetails.length > 0) ||
        flight.priceBreakdown ||
        flight.originalPrice ||
        flight.lastTicketingDate ||
        (flight.validatingAirlineCodes && flight.validatingAirlineCodes.length > 0)
    );

    const formatMinutes = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-4 sm:p-6">
                {/* Top Row: Airline Info */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 z-0">
                                {flight.airline.code}
                            </div>
                            <Image
                                src={flight.airline.logo}
                                alt={flight.airline.name}
                                width={32}
                                height={32}
                                className="object-contain relative z-10 bg-white dark:bg-slate-800 rounded-lg"
                                unoptimized
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm">{flight.airline.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{flight.flightNumber}</span>
                        </div>
                    </div>
                    {flight.stops === 0 && (
                        <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 font-medium text-xs">
                            Direct
                        </Badge>
                    )}
                </div>

                {/* Flight Timeline */}
                <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    {/* Departure */}
                    <div className="flex-1 min-w-0">
                        <div className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
                            {format(depDate, 'HH:mm')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                            {flight.departure.airport.code}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                            {format(depDate, 'MMM d')}
                        </div>
                    </div>

                    {/* Journey Visualization */}
                    <div className="flex-1 flex flex-col items-center py-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
                            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span className="font-medium">{durationString}</span>
                        </div>
                        <div className="w-full relative flex items-center">
                            <div className="flex-1 h-0.5 bg-linear-to-r from-indigo-400 via-indigo-300 to-indigo-400 dark:from-indigo-600 dark:via-indigo-500 dark:to-indigo-600" />
                            <Circle className="w-2 h-2 text-indigo-500 dark:text-indigo-400 fill-current absolute left-0" />
                            {flight.stops > 0 && (
                                <div className="absolute left-1/2 -translate-x-1/2 -top-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                                </div>
                            )}
                            <Plane className="w-3 sm:w-4 h-3 sm:h-4 text-indigo-600 dark:text-indigo-400 rotate-90 absolute left-1/2 -translate-x-1/2" />
                            <Circle className="w-2 h-2 text-indigo-500 dark:text-indigo-400 fill-current absolute right-0" />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
                            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                        </div>
                    </div>

                    {/* Arrival */}
                    <div className="flex-1 min-w-0 text-right">
                        <div className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
                            {format(arrDate, 'HH:mm')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                            {flight.arrival.airport.code}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                            {format(arrDate, 'MMM d')}
                            {isNextDay && <span className="text-orange-500 dark:text-orange-400 ml-1">+1</span>}
                        </div>
                    </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-700/50 gap-3 sm:gap-0">
                    <div className="w-full sm:w-auto">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total price</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-display">
                                ${effectivePrice.toFixed(0)}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">USD</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''} · {searchParams.cabinClass}
                            {searchParams.passengers > 1 && (
                                <span className="ml-1">(${perPassengerPrice.toFixed(0)} / passenger)</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex-1 sm:flex-none"
                            onClick={() => setExpanded(!expanded)}
                            disabled={!hasDetails}
                        >
                            {expanded ? 'Hide' : 'View'} details
                            <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                        </Button>
                        <Button 
                            className="px-6 sm:px-8 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm hover:shadow-md transition-all group-hover:scale-105 transform duration-200 flex-1 sm:flex-none text-sm sm:text-base"
                            onClick={() => router.push(`/booking/${flight.id}`)}
                        >
                            Select
                        </Button>
                    </div>
                </div>
            </div>

            {/* Expanded Segment Details */}
            {expanded && (
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 bg-linear-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-700 dark:text-slate-300">
                        <Info className="w-4 h-4" />
                        <h4 className="text-sm font-semibold font-display">Flight Details</h4>
                    </div>

                    <div className="grid gap-4">
                        <Card className="bg-white/70 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-700/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Fare & Booking</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {flight.oneWay && (
                                        <Badge variant="secondary">One-way</Badge>
                                    )}
                                    {flight.instantTicketingRequired && (
                                        <Badge variant="outline">Instant ticketing</Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Bookable seats</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.numberOfBookableSeats ?? '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Ticketing deadline</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.lastTicketingDate ? format(new Date(flight.lastTicketingDate), 'MMM d, yyyy') : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Validating airline</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.validatingAirlineCodes?.join(', ') || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Offer source</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.source || '—'}
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Total (USD)</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">${effectivePrice.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Base (USD)</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.priceBreakdown?.base ? `$${flight.priceBreakdown.base.toFixed(2)}` : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Fees (USD)</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.priceBreakdown?.fees && flight.priceBreakdown.fees.length > 0
                                                ? `$${flight.priceBreakdown.fees.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2)}`
                                                : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400">Original total</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {flight.originalPrice ? `${flight.originalPrice.currency} ${flight.originalPrice.total.toFixed(2)}` : '—'}
                                        </div>
                                    </div>
                                </div>
                                {flight.priceBreakdown?.fees && flight.priceBreakdown.fees.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        {flight.priceBreakdown.fees.map((fee, index) => (
                                            <div key={`${fee.type || 'fee'}-${index}`} className="flex items-center justify-between rounded-md border border-slate-200/60 dark:border-slate-700/60 px-3 py-2 bg-white/60 dark:bg-slate-900/40">
                                                <span>{fee.type || 'Fee'}</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">${fee.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-white/70 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-700/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Segments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {flight.segments && flight.segments.length > 0 ? (
                                    <div className="space-y-4">
                                        {flight.segments.map((segment, idx) => {
                                            const fareDetail = flight.fareDetails?.find((detail) => detail.segmentId === segment.id);
                                            return (
                                                <div key={segment.id} className="relative">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            {idx < flight.segments.length - 1 && (
                                                                <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 my-2" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-3">
                                                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                                        {segment.departure.airport.code} → {segment.arrival.airport.code}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {segment.airline.name} {segment.flightNumber}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Depart</div>
                                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                                            {format(new Date(segment.departure.at), 'HH:mm, MMM d')}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                            {segment.departure.airport.city} · {segment.departure.airport.name}
                                                                            {segment.departure.terminal ? ` · T${segment.departure.terminal}` : ''}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Arrive</div>
                                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                                            {format(new Date(segment.arrival.at), 'HH:mm, MMM d')}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                            {segment.arrival.airport.city} · {segment.arrival.airport.name}
                                                                            {segment.arrival.terminal ? ` · T${segment.arrival.terminal}` : ''}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {formatMinutes(segment.duration)}
                                                                    </span>
                                                                    {segment.aircraft && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Aircraft: {segment.aircraft}
                                                                        </Badge>
                                                                    )}
                                                                    {segment.operating && segment.operating.code !== segment.airline.code && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Operated by {segment.operating.name}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.cabin && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {fareDetail.cabin}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.class && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Class {fareDetail.class}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.fareBasis && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Fare {fareDetail.fareBasis}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.includedCheckedBags && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Bags {fareDetail.includedCheckedBags.quantity ?? '—'}
                                                                            {fareDetail.includedCheckedBags.weight ? ` · ${fareDetail.includedCheckedBags.weight}${fareDetail.includedCheckedBags.weightUnit || ''}` : ''}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {idx < flight.segments.length - 1 && (
                                                        <div className="ml-9 mb-3 p-3 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                                                            <div className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Layover: {formatMinutes(differenceInMinutes(new Date(flight.segments[idx + 1].departure.at), new Date(segment.arrival.at)))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        No segment details available for this offer.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
