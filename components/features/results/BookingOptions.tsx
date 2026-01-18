"use client"

import { Flight, SearchParams } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, CheckCircle2, Info } from "lucide-react";
import { getPriceForSearch } from "@/lib/api/pricing";
import Image from "next/image";

interface BookingProvider {
    id: string;
    name: string;
    logo?: string;
    price: number;
    currency: string;
    url: string;
    type: "airline" | "ota"; // Online Travel Agency
    benefits?: string[];
    isBestPrice?: boolean;
    searchParams?: {
        origin: string;
        destination: string;
        date: string;
    };
}

interface BookingOptionsProps {
    flight: Flight;
    searchParams: SearchParams;
}

// Generate booking provider URLs with search parameters
function generateBookingProviders(flight: Flight, basePrice: number, searchParams: SearchParams): BookingProvider[] {
    const providers: BookingProvider[] = [];
    
    // Format dates for URLs
    const depDate = new Date(flight.departure.at);
    const depDateStr = depDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Add the airline itself with more realistic search URL
    const airlineSearchUrl = constructAirlineSearchUrl(
        flight.airline.code,
        flight.departure.airport.code,
        flight.arrival.airport.code,
        depDateStr,
        searchParams
    );

    providers.push({
        id: `airline-${flight.airline.code}`,
        name: flight.airline.name,
        logo: flight.airline.logo,
        price: basePrice,
        currency: flight.currency,
        url: airlineSearchUrl,
        type: "airline",
        benefits: ["Direct from airline", "Manage booking easily", "Official source"],
        searchParams: { origin: flight.departure.airport.code, destination: flight.arrival.airport.code, date: depDateStr }
    });

    // Add OTAs with search URLs
    const otas = [
        { 
            name: "Expedia", 
            domain: "expedia.com",
            logo: "https://img.icons8.com/color/600/expedia.png",
            priceModifier: 1.02, 
            benefits: ["24/7 support", "Rewards program"] 
        },
        { 
            name: "Kayak", 
            domain: "kayak.com",
            logo: "https://play-lh.googleusercontent.com/os2nMGSSawnCl1UOcgmggZ_Vbbv4-xzw--kaYW6iFs6gj8AEAdsgIrZS8do4ibTQVpY=w240-h480-rw",
            priceModifier: 1.01, 
            benefits: ["Price tracking", "Flexible dates"] 
        },
        { 
            name: "Skyscanner", 
            domain: "skyscanner.com",
            logo: "https://play-lh.googleusercontent.com/BLSf5-GEWCx1ENuXvTVWwdok_xWSvIWrUFHyqFTSa8WtHN5S2a4l1m6Mc9J8K0lpWJM",
            priceModifier: 1.00, 
            benefits: ["Compare all sites", "Price alerts"] 
        },
    ];

    otas.forEach((ota) => {
        const otaPrice = basePrice * ota.priceModifier;
        const otaSearchUrl = constructOTASearchUrl(
            ota.domain,
            flight.departure.airport.code,
            flight.arrival.airport.code,
            depDateStr,
            searchParams
        );

        providers.push({
            id: `ota-${ota.name}`,
            name: ota.name,
            logo: ota.logo,
            price: otaPrice,
            currency: flight.currency,
            url: otaSearchUrl,
            type: "ota",
            benefits: ota.benefits,
            searchParams: { origin: flight.departure.airport.code, destination: flight.arrival.airport.code, date: depDateStr }
        });
    });

    // Mark the lowest price
    const lowestPrice = Math.min(...providers.map(p => p.price));
    providers.forEach(p => {
        if (p.price === lowestPrice) {
            p.isBestPrice = true;
        }
    });

    // Sort by price
    return providers.sort((a, b) => a.price - b.price);
}

// Construct airline-specific search URLs
function constructAirlineSearchUrl(
    airlineCode: string, 
    origin: string, 
    destination: string, 
    date: string,
    searchParams: SearchParams
): string {
    // Map common airlines to their booking URLs
    const airlineUrls: Record<string, string> = {
        'AA': `https://www.aa.com/booking/find-flights?origin=${origin}&destination=${destination}&departureDate=${date}&passengers=${searchParams.passengers}`,
        'DL': `https://www.delta.com/flight-search/book-a-flight?origin=${origin}&destination=${destination}&departureDate=${date}`,
        'UA': `https://www.united.com/en/us/fsr/choose-flights?f=${origin}&t=${destination}&d=${date}&tt=1&at=1`,
        'BA': `https://www.britishairways.com/travel/book/public/en_us?eId=106019&origin=${origin}&destination=${destination}`,
        'WS': `https://www.westjet.com/en-ca/flight-search?departureCode=${origin}&arrivalCode=${destination}&departureDate=${date}&numAdults=${searchParams.passengers}`,
        'HA': `https://www.hawaiianairlines.com/search/results?O=${origin}&D=${destination}&OD=${date}&A=${searchParams.passengers}&RT=false&locale=en-us`,
        'AS': `https://www.alaskaair.com/search/results?O=${origin}&D=${destination}&OD=${date}&A=${searchParams.passengers}&RT=false&locale=en-us`,
        // Add more airlines as needed
    };

    return airlineUrls[airlineCode] || `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${date}`;
}

// Construct OTA search URLs
function constructOTASearchUrl(
    domain: string,
    origin: string,
    destination: string,
    date: string,
    searchParams: SearchParams
): string {
    // Format date for Skyscanner (YYMMDD format)
    const dateObj = new Date(date);
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const skyscannerDate = `${year}${month}${day}`;
    
    const cabinClassMap: Record<string, string> = {
        'Economy': 'economy',
        'Premium Economy': 'premium_economy',
        'Business': 'business',
        'First': 'first'
    };
    
    const kayakCabinMap: Record<string, string> = {
        'Economy': 'e',
        'Premium Economy': 'p',
        'Business': 'b',
        'First': 'f'
    };

    const baseUrls: Record<string, string> = {
        'expedia.com': `https://www.expedia.com/Flights-Search?flight-type=on&mode=search&trip=one-way&leg1=from:${origin},to:${destination},departure:${date}&passengers=adults:${searchParams.passengers}`,
        'kayak.com': `https://booking.kayak.com/flights/${origin}-${destination}/${date}?sort=bestflight_a&fs=stops=0&cabin=${kayakCabinMap[searchParams.cabinClass] || 'e'}&travelers=${searchParams.passengers}`,
        'skyscanner.com': `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${skyscannerDate}/?adultsv2=${searchParams.passengers}&cabinclass=${cabinClassMap[searchParams.cabinClass] || 'economy'}&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`,
    };

    return baseUrls[domain] || `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${date}`;
}

export function BookingOptions({ flight, searchParams }: BookingOptionsProps) {
    const effectivePrice = getPriceForSearch(
        flight,
        searchParams.passengers,
        searchParams.cabinClass
    );

    const providers = generateBookingProviders(flight, effectivePrice, searchParams);

    return (
        <div className="mt-4">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            Booking Options
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {providers.length} options
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Compare prices across different booking sites. Links will take you to each provider&apos;s search page.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {providers.map((provider) => (
                        <div
                            key={provider.id}
                            className={`relative group rounded-xl border transition-all duration-200 ${
                                provider.isBestPrice
                                    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                        >
                            {provider.isBestPrice && (
                                <div className="absolute -top-3 left-4">
                                    <Badge className="bg-green-500 text-white border-0 shadow-sm">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Lowest price
                                    </Badge>
                                </div>
                            )}

                            <div className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    {/* Provider Info */}
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                                            {provider.logo ? (
                                                <Image
                                                    src={provider.logo}
                                                    alt={provider.name}
                                                    width={64}
                                                    height={64}
                                                    className="object-contain p-2"
                                                    unoptimized
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                                    {provider.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg">
                                                    {provider.name}
                                                </h3>
                                                <Badge 
                                                    variant="outline" 
                                                    className="text-xs"
                                                >
                                                    {provider.type === "airline" ? "Airline" : "Travel Site"}
                                                </Badge>
                                            </div>
                                            {provider.benefits && provider.benefits.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {provider.benefits.map((benefit, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                            {benefit}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                        <div className="text-right flex-1 sm:flex-none">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                Total price
                                            </div>
                                            <div className="flex items-baseline gap-1 justify-end">
                                                <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                                    ${provider.price.toFixed(0)}
                                                </span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    {provider.currency}
                                                </span>
                                            </div>
                                        </div>
                                        <a 
                                            href={provider.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                className={`px-6 py-2 shadow-sm hover:shadow-md transition-all ${
                                                    provider.isBestPrice
                                                        ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                                } text-white`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    View on {provider.name}
                                                    <ExternalLink className="w-4 h-4" />
                                                </span>
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Separator className="my-4" />

                    {/* Important Info */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm space-y-2">
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                    About booking links
                                </p>
                                <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                    <li>Links direct you to provider search pages with pre-filled flight details</li>
                                    <li>Final prices may vary based on availability and provider fees</li>
                                    <li>You&apos;ll need to search for this specific flight on the provider&apos;s site</li>
                                    <li>Estimated prices include taxes + fees for {searchParams.passengers} adult{searchParams.passengers > 1 ? 's' : ''}</li>
                                </ul>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <strong>Note:</strong> These are comparison estimates. For direct booking with guaranteed pricing, contact the airline or use their official booking platform.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
