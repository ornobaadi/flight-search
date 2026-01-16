"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export default function ApiTestPage() {
    const [locationKeyword, setLocationKeyword] = React.useState("London")
    const [locationResults, setLocationResults] = React.useState<any>(null)
    const [locationLoading, setLocationLoading] = React.useState(false)
    const [locationError, setLocationError] = React.useState<string | null>(null)

    const [flightOrigin, setFlightOrigin] = React.useState("NYC")
    const [flightDestination, setFlightDestination] = React.useState("LON")
    const [flightDate, setFlightDate] = React.useState("2026-02-01")
    const [flightResults, setFlightResults] = React.useState<any>(null)
    const [flightLoading, setFlightLoading] = React.useState(false)
    const [flightError, setFlightError] = React.useState<string | null>(null)

    const testLocationAPI = async () => {
        setLocationLoading(true)
        setLocationError(null)
        setLocationResults(null)

        try {
            const response = await fetch(`/api/locations?keyword=${encodeURIComponent(locationKeyword)}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch locations")
            }
            
            setLocationResults(data)
        } catch (error: any) {
            setLocationError(error.message)
        } finally {
            setLocationLoading(false)
        }
    }

    const testFlightAPI = async () => {
        setFlightLoading(true)
        setFlightError(null)
        setFlightResults(null)

        try {
            const params = new URLSearchParams({
                origin: flightOrigin,
                destination: flightDestination,
                date: flightDate
            })
            
            const response = await fetch(`/api/flights?${params.toString()}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch flights")
            }
            
            setFlightResults(data)
        } catch (error: any) {
            setFlightError(error.message)
        } finally {
            setFlightLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900 font-display">API Testing Dashboard</h1>
                    <p className="text-slate-600">Test your Amadeus API integration</p>
                </div>

                {/* Environment Check */}
                <Card className="border-2 border-indigo-200 bg-indigo-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-display">
                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                            Environment Setup
                        </CardTitle>
                        <CardDescription>
                            Make sure you have configured your .env.local file with Amadeus credentials
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="bg-white p-4 rounded-lg border border-indigo-200">
                            <p className="text-sm font-mono text-slate-700">AMADEUS_CLIENT_ID={process.env.NEXT_PUBLIC_HAS_AMADEUS_ID ? "✓ Set" : "✗ Not set"}</p>
                            <p className="text-sm font-mono text-slate-700">AMADEUS_CLIENT_SECRET={process.env.NEXT_PUBLIC_HAS_AMADEUS_SECRET ? "✓ Set" : "✗ Not set"}</p>
                        </div>
                        <p className="text-xs text-slate-600">
                            Get your free test credentials at: <a href="https://developers.amadeus.com/" target="_blank" className="text-indigo-600 underline">developers.amadeus.com</a>
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Locations API Test */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-display">Test Locations API</CardTitle>
                            <CardDescription>Search for airports and cities</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="keyword">Search Keyword</Label>
                                <Input
                                    id="keyword"
                                    value={locationKeyword}
                                    onChange={(e) => setLocationKeyword(e.target.value)}
                                    placeholder="e.g., London, Paris, NYC"
                                    onKeyDown={(e) => e.key === "Enter" && testLocationAPI()}
                                />
                            </div>
                            
                            <Button 
                                onClick={testLocationAPI} 
                                disabled={locationLoading || !locationKeyword}
                                className="w-full"
                            >
                                {locationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Test Location Search
                            </Button>

                            {/* Results */}
                            {locationError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-900">Error</p>
                                        <p className="text-sm text-red-700">{locationError}</p>
                                    </div>
                                </div>
                            )}

                            {locationResults && !locationError && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <p className="font-semibold text-green-900">Success!</p>
                                        <Badge variant="secondary">{locationResults.locations?.length || 0} results</Badge>
                                    </div>
                                    
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {locationResults.locations?.map((loc: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded border border-green-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-900">{loc.city}</span>
                                                    <Badge>{loc.code}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-600">{loc.name}</p>
                                                <p className="text-xs text-slate-500">{loc.country}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Flights API Test */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-display">Test Flights API</CardTitle>
                            <CardDescription>Search for flight offers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="origin">Origin (Airport Code)</Label>
                                <Input
                                    id="origin"
                                    value={flightOrigin}
                                    onChange={(e) => setFlightOrigin(e.target.value.toUpperCase())}
                                    placeholder="NYC"
                                    maxLength={3}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination (Airport Code)</Label>
                                <Input
                                    id="destination"
                                    value={flightDestination}
                                    onChange={(e) => setFlightDestination(e.target.value.toUpperCase())}
                                    placeholder="LON"
                                    maxLength={3}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="date">Departure Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={flightDate}
                                    onChange={(e) => setFlightDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            
                            <Button 
                                onClick={testFlightAPI} 
                                disabled={flightLoading || !flightOrigin || !flightDestination || !flightDate}
                                className="w-full"
                            >
                                {flightLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Test Flight Search
                            </Button>

                            {/* Results */}
                            {flightError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-900">Error</p>
                                        <p className="text-sm text-red-700">{flightError}</p>
                                    </div>
                                </div>
                            )}

                            {flightResults && !flightError && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <p className="font-semibold text-green-900">Success!</p>
                                        <Badge variant="secondary">{flightResults.flights?.length || 0} flights</Badge>
                                    </div>
                                    
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {flightResults.flights?.slice(0, 5).map((flight: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded border border-green-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-slate-900">{flight.airline.name}</span>
                                                    <Badge variant="outline">{flight.price} {flight.currency}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    {flight.departure.airport.code} → {flight.arrival.airport.code}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} • {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <a href="/" className="block text-indigo-600 hover:underline">← Back to Home</a>
                        <a href="/search?origin=NYC&destination=LON&date=2026-02-01T00:00:00.000Z" className="block text-indigo-600 hover:underline">
                            Try a sample search (NYC → London)
                        </a>
                        <a href="https://developers.amadeus.com/self-service/category/flights" target="_blank" className="block text-indigo-600 hover:underline">
                            Amadeus API Documentation ↗
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
