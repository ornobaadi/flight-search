"use client"

import { Flight, SearchParams } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Circle, Plane, Luggage, ChevronDown, Info } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { getPriceForSearch } from "@/lib/api/pricing";
import Image from "next/image";
import { useState } from "react";

interface FlightDetailsProps {
    flight: Flight;
    searchParams: SearchParams;
}

export function FlightDetails({ flight, searchParams }: FlightDetailsProps) {
    const [showDetails, setShowDetails] = useState(false);
    const effectivePrice = getPriceForSearch(
        flight,
        searchParams.passengers,
        searchParams.cabinClass
    );
    const perPassengerPrice = effectivePrice / Math.max(searchParams.passengers, 1);

    const hours = Math.floor(flight.duration / 60);
    const minutes = flight.duration % 60;
    const durationString = `${hours}h ${minutes}m`;

    const depDate = new Date(flight.departure.at);
    const arrDate = new Date(flight.arrival.at);
    const isNextDay = depDate.getDate() !== arrDate.getDate();

    // Get baggage info if available
    const baggageInfo = flight.fareDetails?.[0]?.includedCheckedBags;

    const formatMinutes = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    };

    const hasDetails = Boolean(
        (flight.segments && flight.segments.length > 0) ||
        (flight.fareDetails && flight.fareDetails.length > 0) ||
        flight.priceBreakdown ||
        flight.originalPrice ||
        flight.lastTicketingDate ||
        (flight.validatingAirlineCodes && flight.validatingAirlineCodes.length > 0)
    );

    return (
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 mb-4">
            <CardContent className="p-4">

                {/* Airline Info */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative w-12 h-12 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300 z-0">
                            {flight.airline.code}
                        </div>
                        <Image
                            src={flight.airline.logo}
                            alt={flight.airline.name}
                            width={40}
                            height={40}
                            className="object-contain relative z-10 bg-white dark:bg-slate-800 rounded-lg"
                            unoptimized
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-xl">
                            {flight.airline.name}
                        </h3>
                        <p className="text-base text-slate-500 dark:text-slate-400">
                            {flight.flightNumber}
                        </p>
                    </div>
                    {flight.stops === 0 && (
                        <Badge className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                            Direct flight
                        </Badge>
                    )}
                </div>

                {/* Flight Timeline */}
                <div className="mb-6">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center mb-6">
                        {/* Departure */}
                        <div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                                Departing flight · {format(depDate, 'EEE, MMM d')}
                            </div>
                            <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                {format(depDate, 'HH:mm')}
                            </div>
                            <div className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                {flight.departure.airport.code}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {flight.departure.airport.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {flight.departure.airport.city}, {flight.departure.airport.country}
                            </div>
                        </div>

                        {/* Journey Info */}
                        <div className="flex flex-col items-center justify-center px-8">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                <Clock className="w-4 h-4" />
                                <span>{durationString}</span>
                            </div>
                            <div className="w-32 relative flex items-center mb-3">
                                <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-400 dark:from-indigo-600 dark:via-indigo-500 dark:to-indigo-600" />
                                <Circle className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 fill-current absolute left-0" />
                                {flight.stops > 0 && (
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                                    </div>
                                )}
                                <Plane className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rotate-90 absolute left-1/2 -translate-x-1/2" />
                                <Circle className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 fill-current absolute right-0" />
                            </div>
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                                Arrival · {format(arrDate, 'EEE, MMM d')}
                            </div>
                            <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                {format(arrDate, 'HH:mm')}
                                {isNextDay && (
                                    <span className="text-orange-500 dark:text-orange-400 text-2xl ml-2">+1</span>
                                )}
                            </div>
                            <div className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                {flight.arrival.airport.code}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {flight.arrival.airport.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {flight.arrival.airport.city}, {flight.arrival.airport.country}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">Total price</div>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                            ${effectivePrice.toFixed(0)}
                        </div>
                        {searchParams.passengers > 1 && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                ${perPassengerPrice.toFixed(0)} per person
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">Cabin class</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {searchParams.cabinClass}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">Passengers</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {searchParams.passengers} {searchParams.passengers === 1 ? 'Adult' : 'Adults'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Luggage className="w-4 h-4" />
                            Checked bags
                        </div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {baggageInfo?.quantity ? (
                                <div>
                                    {baggageInfo.quantity} free carry-on
                                    {baggageInfo.weight && (
                                        <div className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                            {baggageInfo.weight}{baggageInfo.weightUnit} each
                                        </div>
                                    )}
                                </div>
                            ) : (
                                '1 free carry-on'
                            )}
                        </div>
                    </div>
                </div>

                {/* Emissions */}
                {flight.priceBreakdown && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Average legroom (30 in) · In-seat USB outlet · On-demand video
                        </div>
                    </div>
                )}

                {/* Toggle Details Button */}
                {hasDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="ghost"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                            {showDetails ? 'Hide' : 'View'} detailed flight information
                            <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                )}
            </CardContent>

            {/* Collapsible  Information */}
            {showDetails && hasDetails && (
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 bg-linear-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-900/30 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                        <Info className="w-5 h-5" />
                        <h4 className="text-base font-semibold font-display">Complete Flight Details</h4>
                    </div>

                    <div className="grid gap-4">
                        {/* Fare & Booking Details */}
                        <Card className="bg-white/70 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-700/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Fare & Booking</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2 text-sm">
                                    {flight.oneWay && (
                                        <Badge variant="secondary">One-way</Badge>
                                    )}
                                    {flight.instantTicketingRequired && (
                                        <Badge variant="outline">Instant ticketing</Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Bookable seats</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.numberOfBookableSeats ?? '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Ticketing deadline</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.lastTicketingDate ? format(new Date(flight.lastTicketingDate), 'MMM d, yyyy') : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Validating airline</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.validatingAirlineCodes?.join(', ') || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Offer source</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.source || '—'}
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Total (USD)</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">${effectivePrice.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Base (USD)</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.priceBreakdown?.base ? `$${flight.priceBreakdown.base.toFixed(2)}` : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Fees (USD)</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.priceBreakdown?.fees && flight.priceBreakdown.fees.length > 0
                                                ? `$${flight.priceBreakdown.fees.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2)}`
                                                : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 dark:text-slate-400 mb-1">Original total</div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-base">
                                            {flight.originalPrice ? `${flight.originalPrice.currency} ${flight.originalPrice.total.toFixed(2)}` : '—'}
                                        </div>
                                    </div>
                                </div>
                                {flight.priceBreakdown?.fees && flight.priceBreakdown.fees.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        {flight.priceBreakdown.fees.map((fee, index) => (
                                            <div key={`${fee.type || 'fee'}-${index}`} className="flex items-center justify-between rounded-md border border-slate-200/60 dark:border-slate-700/60 px-3 py-2 bg-white/60 dark:bg-slate-900/40">
                                                <span>{fee.type || 'Fee'}</span>
                                                <span className="font-semibold text-slate-900 dark:text-white text-base">${fee.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Segments Details */}
                        <Card className="bg-white/70 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-700/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Flight Segments</CardTitle>
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
                                                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            {idx < flight.segments.length - 1 && (
                                                                <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 my-2" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-3">
                                                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                                    <span className="font-semibold text-slate-900 dark:text-white text-base">
                                                                        {segment.departure.airport.code} → {segment.arrival.airport.code}
                                                                    </span>
                                                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                                                        {segment.airline.name} {segment.flightNumber}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-base">
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">Depart</div>
                                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                                            {format(new Date(segment.departure.at), 'HH:mm, MMM d')}
                                                                        </div>
                                                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                            {segment.departure.airport.city} · {segment.departure.airport.name}
                                                                            {segment.departure.terminal ? ` · T${segment.departure.terminal}` : ''}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">Arrive</div>
                                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                                            {format(new Date(segment.arrival.at), 'HH:mm, MMM d')}
                                                                        </div>
                                                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                            {segment.arrival.airport.city} · {segment.arrival.airport.name}
                                                                            {segment.arrival.terminal ? ` · T${segment.arrival.terminal}` : ''}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock className="w-4 h-4" />
                                                                        {formatMinutes(segment.duration)}
                                                                    </span>
                                                                    {segment.aircraft && (
                                                                        <Badge variant="outline" className="text-sm">
                                                                            Aircraft: {segment.aircraft}
                                                                        </Badge>
                                                                    )}
                                                                    {segment.operating && segment.operating.code !== segment.airline.code && (
                                                                        <Badge variant="outline" className="text-sm">
                                                                            Operated by {segment.operating.name}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.cabin && (
                                                                        <Badge variant="secondary" className="text-sm">
                                                                            {fareDetail.cabin}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.class && (
                                                                        <Badge variant="secondary" className="text-sm">
                                                                            Class {fareDetail.class}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.fareBasis && (
                                                                        <Badge variant="outline" className="text-sm">
                                                                            Fare {fareDetail.fareBasis}
                                                                        </Badge>
                                                                    )}
                                                                    {fareDetail?.includedCheckedBags && (
                                                                        <Badge variant="outline" className="text-sm">
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
                                                            <div className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" />
                                                                Layover: {formatMinutes(differenceInMinutes(new Date(flight.segments[idx + 1].departure.at), new Date(segment.arrival.at)))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-base text-slate-500 dark:text-slate-400">
                                        No segment details available for this offer.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </Card>
    );
}
