"use client"

import { useEffect, useState } from "react"
import { Map, MapRoute, MapMarker, MarkerContent, MapControls } from "@/components/ui/map"
import { Plane } from "lucide-react"
import { cn } from "@/lib/utils"

interface AirportCoordinates {
    code: string
    name: string
    city: string
    coordinates: [number, number] // [longitude, latitude]
}

interface FlightRouteMapProps {
    origin: string
    destination: string
    className?: string
}

// Airport coordinates cache (you should expand this with more airports)
const AIRPORT_COORDS: Record<string, AirportCoordinates> = {
    "JFK": {
        code: "JFK",
        name: "John F. Kennedy International Airport",
        city: "New York",
        coordinates: [-73.7781, 40.6413]
    },
    "LHR": {
        code: "LHR",
        name: "London Heathrow Airport",
        city: "London",
        coordinates: [-0.4543, 51.4700]
    },
    "LAX": {
        code: "LAX",
        name: "Los Angeles International Airport",
        city: "Los Angeles",
        coordinates: [-118.4085, 33.9416]
    },
    "ORD": {
        code: "ORD",
        name: "O'Hare International Airport",
        city: "Chicago",
        coordinates: [-87.9048, 41.9742]
    },
    "DXB": {
        code: "DXB",
        name: "Dubai International Airport",
        city: "Dubai",
        coordinates: [55.3644, 25.2532]
    },
    "SIN": {
        code: "SIN",
        name: "Singapore Changi Airport",
        city: "Singapore",
        coordinates: [103.9915, 1.3644]
    },
    "CDG": {
        code: "CDG",
        name: "Charles de Gaulle Airport",
        city: "Paris",
        coordinates: [2.5479, 49.0097]
    },
    "FRA": {
        code: "FRA",
        name: "Frankfurt Airport",
        city: "Frankfurt",
        coordinates: [8.5622, 50.0379]
    },
    "NRT": {
        code: "NRT",
        name: "Narita International Airport",
        city: "Tokyo",
        coordinates: [140.3929, 35.7720]
    },
    "HND": {
        code: "HND",
        name: "Tokyo Haneda Airport",
        city: "Tokyo",
        coordinates: [139.7798, 35.5494]
    },
    "SFO": {
        code: "SFO",
        name: "San Francisco International Airport",
        city: "San Francisco",
        coordinates: [-122.3789, 37.6213]
    },
    "ATL": {
        code: "ATL",
        name: "Hartsfield-Jackson Atlanta International Airport",
        city: "Atlanta",
        coordinates: [-84.4281, 33.6407]
    },
    "DEL": {
        code: "DEL",
        name: "Indira Gandhi International Airport",
        city: "New Delhi",
        coordinates: [77.1025, 28.5562]
    },
    "HYD": {
        code: "HYD",
        name: "Rajiv Gandhi International Airport",
        city: "Hyderabad",
        coordinates: [78.4294, 17.2403]
    },
    "BOM": {
        code: "BOM",
        name: "Chhatrapati Shivaji Maharaj International Airport",
        city: "Mumbai",
        coordinates: [72.8777, 19.0896]
    },
    "BLR": {
        code: "BLR",
        name: "Kempegowda International Airport",
        city: "Bangalore",
        coordinates: [77.7064, 13.1986]
    },
    "BER": {
        code: "BER",
        name: "Berlin Brandenburg Airport",
        city: "Berlin",
        coordinates: [13.5036, 52.3667]
    },
    "AMS": {
        code: "AMS",
        name: "Amsterdam Airport Schiphol",
        city: "Amsterdam",
        coordinates: [4.7683, 52.3105]
    },
    "MAD": {
        code: "MAD",
        name: "Adolfo Suárez Madrid-Barajas Airport",
        city: "Madrid",
        coordinates: [-3.5673, 40.4719]
    },
    "BCN": {
        code: "BCN",
        name: "Barcelona-El Prat Airport",
        city: "Barcelona",
        coordinates: [2.0785, 41.2974]
    },
    "MAN": {
        code: "MAN",
        name: "Manchester Airport",
        city: "Manchester",
        coordinates: [-2.2750, 53.3537]
    },
    "LGW": {
        code: "LGW",
        name: "London Gatwick Airport",
        city: "London",
        coordinates: [-0.1903, 51.1537]
    },
    "JNB": {
        code: "JNB",
        name: "O. R. Tambo International Airport",
        city: "Johannesburg",
        coordinates: [28.2460, -26.1392]
    },
    "SYD": {
        code: "SYD",
        name: "Sydney Kingsford Smith Airport",
        city: "Sydney",
        coordinates: [151.1772, -33.9399]
    },
    "MEL": {
        code: "MEL",
        name: "Melbourne Airport",
        city: "Melbourne",
        coordinates: [144.8432, -37.6690]
    },
    "YYZ": {
        code: "YYZ",
        name: "Toronto Pearson International Airport",
        city: "Toronto",
        coordinates: [-79.6248, 43.6777]
    },
    "YVR": {
        code: "YVR",
        name: "Vancouver International Airport",
        city: "Vancouver",
        coordinates: [-123.1815, 49.1947]
    },
    "ICN": {
        code: "ICN",
        name: "Incheon International Airport",
        city: "Seoul",
        coordinates: [126.4506, 37.4602]
    },
    "PEK": {
        code: "PEK",
        name: "Beijing Capital International Airport",
        city: "Beijing",
        coordinates: [116.5846, 40.0725]
    },
    "PVG": {
        code: "PVG",
        name: "Shanghai Pudong International Airport",
        city: "Shanghai",
        coordinates: [121.8050, 31.1434]
    },
    "HKG": {
        code: "HKG",
        name: "Hong Kong International Airport",
        city: "Hong Kong",
        coordinates: [113.9145, 22.3080]
    },
    "BKK": {
        code: "BKK",
        name: "Suvarnabhumi Airport",
        city: "Bangkok",
        coordinates: [100.7501, 13.6900]
    },
    "IST": {
        code: "IST",
        name: "Istanbul Airport",
        city: "Istanbul",
        coordinates: [28.8159, 41.2753]
    },
    "MUC": {
        code: "MUC",
        name: "Munich Airport",
        city: "Munich",
        coordinates: [11.7861, 48.3538]
    },
    "ZRH": {
        code: "ZRH",
        name: "Zurich Airport",
        city: "Zurich",
        coordinates: [8.5491, 47.4647]
    },
    "FCO": {
        code: "FCO",
        name: "Leonardo da Vinci-Fiumicino Airport",
        city: "Rome",
        coordinates: [12.2389, 41.8003]
    },
    "MIA": {
        code: "MIA",
        name: "Miami International Airport",
        city: "Miami",
        coordinates: [-80.2906, 25.7959]
    },
    "SEA": {
        code: "SEA",
        name: "Seattle-Tacoma International Airport",
        city: "Seattle",
        coordinates: [-122.3088, 47.4502]
    },
    "DEN": {
        code: "DEN",
        name: "Denver International Airport",
        city: "Denver",
        coordinates: [-104.6737, 39.8561]
    },
    "LAS": {
        code: "LAS",
        name: "Harry Reid International Airport",
        city: "Las Vegas",
        coordinates: [-115.1523, 36.0840]
    },
    "MCO": {
        code: "MCO",
        name: "Orlando International Airport",
        city: "Orlando",
        coordinates: [-81.3081, 28.4294]
    },
    "BOS": {
        code: "BOS",
        name: "Boston Logan International Airport",
        city: "Boston",
        coordinates: [-71.0096, 42.3656]
    },
    "IAH": {
        code: "IAH",
        name: "George Bush Intercontinental Airport",
        city: "Houston",
        coordinates: [-95.3414, 29.9902]
    },
    "DFW": {
        code: "DFW",
        name: "Dallas/Fort Worth International Airport",
        city: "Dallas",
        coordinates: [-97.0372, 32.8998]
    }
}

async function fetchAirportCoordinates(airportCode: string): Promise<AirportCoordinates | null> {
    // First check our cache
    if (AIRPORT_COORDS[airportCode]) {
        return AIRPORT_COORDS[airportCode]
    }

    try {
        // Use AI to get approximate coordinates
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Return ONLY a JSON object (no markdown, no explanation) with the airport coordinates for ${airportCode}. Format: {"code":"${airportCode}","name":"Airport Name","city":"City","coordinates":[longitude,latitude]}. Use exact decimal coordinates.`
            })
        })

        if (!response.ok) {
            throw new Error('Failed to fetch coordinates')
        }

        const data = await response.json()
        
        // Try to parse the AI response
        try {
            const cleanedResponse = data.response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()
            
            const coords = JSON.parse(cleanedResponse)
            return coords
        } catch (parseError) {
            console.error('Failed to parse AI response:', data.response)
            return null
        }
    } catch (error) {
        console.error(`Failed to fetch coordinates for ${airportCode}:`, error)
        return null
    }
}

function calculateGreatCircleRoute(
    start: [number, number],
    end: [number, number],
    numPoints: number = 100
): [number, number][] {
    const [lon1, lat1] = start
    const [lon2, lat2] = end

    // Convert to radians
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const λ1 = (lon1 * Math.PI) / 180
    const λ2 = (lon2 * Math.PI) / 180

    // Calculate the great circle distance
    const Δλ = λ2 - λ1
    const d = Math.acos(
        Math.sin(φ1) * Math.sin(φ2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    )

    const points: [number, number][] = []

    // Handle case where points are very close or identical
    if (Math.abs(d) < 0.0001) {
        return [start, end]
    }

    for (let i = 0; i <= numPoints; i++) {
        const f = i / numPoints

        // Spherical linear interpolation (slerp)
        const a = Math.sin((1 - f) * d) / Math.sin(d)
        const b = Math.sin(f * d) / Math.sin(d)

        // Convert to 3D Cartesian coordinates
        const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2)
        const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2)
        const z = a * Math.sin(φ1) + b * Math.sin(φ2)

        // Convert back to lat/lon
        const φ = Math.atan2(z, Math.sqrt(x * x + y * y))
        const λ = Math.atan2(y, x)

        points.push([
            (λ * 180) / Math.PI,
            (φ * 180) / Math.PI
        ])
    }

    return points
}

export function FlightRouteMap({ origin, destination, className }: FlightRouteMapProps) {
    const [originCoords, setOriginCoords] = useState<AirportCoordinates | null>(null)
    const [destCoords, setDestCoords] = useState<AirportCoordinates | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showError, setShowError] = useState(false)
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])

    useEffect(() => {
        async function loadCoordinates() {
            setIsLoading(true)
            setShowError(false)
            
            // Set a timer to show error after 15 seconds if still loading
            const errorTimeout = setTimeout(() => {
                if (isLoading) {
                    setShowError(true)
                }
            }, 15000)

            try {
                const [originData, destData] = await Promise.all([
                    fetchAirportCoordinates(origin),
                    fetchAirportCoordinates(destination)
                ])

                clearTimeout(errorTimeout)

                setOriginCoords(originData)
                setDestCoords(destData)

                if (originData && destData) {
                    // Calculate great circle route
                    const route = calculateGreatCircleRoute(
                        originData.coordinates,
                        destData.coordinates
                    )
                    setRouteCoordinates(route)
                }
            } catch (error) {
                console.error('Error loading coordinates:', error)
                // Don't set error immediately, let the timeout handle it
            } finally {
                setIsLoading(false)
            }
        }

        loadCoordinates()
    }, [origin, destination])

    if (isLoading) {
        return (
            <div className={cn("relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden", className)}>
                <div className="absolute inset-0 animate-pulse">
                    {/* Skeleton map background */}
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
                    
                    {/* Skeleton markers */}
                    <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    
                    {/* Skeleton path */}
                    <div className="absolute top-1/3 left-1/4 right-1/3 h-1 bg-slate-300 dark:bg-slate-600 transform rotate-12" style={{ transformOrigin: 'left center' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading route map...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!originCoords || !destCoords || showError) {
        return (
            <div className={cn("relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden p-8", className)}>
                <div className="text-center text-slate-600 dark:text-slate-400">
                    <p className="text-sm">Unable to load route map for {origin} → {destination}</p>
                    <p className="text-xs mt-2 text-slate-500">Map data temporarily unavailable</p>
                </div>
            </div>
        )
    }

    // Calculate center point and zoom level
    const centerLon = (originCoords.coordinates[0] + destCoords.coordinates[0]) / 2
    const centerLat = (originCoords.coordinates[1] + destCoords.coordinates[1]) / 2

    // Calculate distance to determine zoom level
    const lonDiff = Math.abs(originCoords.coordinates[0] - destCoords.coordinates[0])
    const latDiff = Math.abs(originCoords.coordinates[1] - destCoords.coordinates[1])
    const maxDiff = Math.max(lonDiff, latDiff)
    
    // Approximate zoom level based on distance (more zoomed out)
    let zoom = 3
    if (maxDiff < 5) zoom = 5.7
    else if (maxDiff < 20) zoom = 3.8
    else if (maxDiff < 50) zoom = 3
    else if (maxDiff < 100) zoom = 2.2
    else zoom = 1.6

    return (
        <div className={cn("relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700", className)}>
            <div className="w-full h-full">
                <Map
                    center={[centerLon, centerLat]}
                    zoom={zoom}
                >
                    {/* Map Controls */}
                    <MapControls
                        position="bottom-right"
                        showZoom
                        showCompass
                        showLocate
                        showFullscreen
                    />

                    {/* Flight route line */}
                    {routeCoordinates.length > 0 && (
                        <MapRoute
                            coordinates={routeCoordinates}
                            color="#6366f1"
                            width={3}
                            opacity={0.8}
                            dashArray={[2, 2]}
                        />
                    )}

                    {/* Origin marker */}
                    <MapMarker longitude={originCoords.coordinates[0]} latitude={originCoords.coordinates[1]}>
                        <MarkerContent>
                            <div className="bg-green-500 rounded-full p-2 shadow-lg border-2 border-white">
                                <Plane className="w-4 h-4 text-white" />
                            </div>
                        </MarkerContent>
                    </MapMarker>

                    {/* Destination marker */}
                    <MapMarker longitude={destCoords.coordinates[0]} latitude={destCoords.coordinates[1]}>
                        <MarkerContent>
                            <div className="bg-red-500 rounded-full p-2 shadow-lg border-2 border-white">
                                <Plane className="w-4 h-4 text-white rotate-90" />
                            </div>
                        </MarkerContent>
                    </MapMarker>
                </Map>
            </div>

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full border border-white" />
                        <span className="text-slate-700 dark:text-slate-300">
                            {originCoords.code} - {originCoords.city}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full border border-white" />
                        <span className="text-slate-700 dark:text-slate-300">
                            {destCoords.code} - {destCoords.city}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
