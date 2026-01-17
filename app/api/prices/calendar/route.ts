import { NextResponse } from "next/server"
import { format, startOfMonth, endOfMonth, parse, eachDayOfInterval } from "date-fns"
import { amadeus } from "@/lib/amadeus-client"
import { convertToUSD } from "@/lib/currency-converter"

interface PriceCalendarCacheEntry {
    data: Record<string, number>
    expiresAt: number
    refreshUntil: number
    refreshing?: Promise<Record<string, number>>
}

const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour
const STALE_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours

const globalWithCache = globalThis as typeof globalThis & {
    __priceCalendarCache?: Map<string, PriceCalendarCacheEntry>
}

const priceCalendarCache =
    globalWithCache.__priceCalendarCache ??
    (globalWithCache.__priceCalendarCache = new Map())

function buildCacheKey(params: {
    origin: string
    destination: string
    month: string
    tripType: string
    tripDuration: number
}) {
    return `${params.origin}-${params.destination}-${params.month}-${params.tripType}-${params.tripDuration}`
}

// Fetch cheapest price for a single date using flightOffersSearch
async function fetchSingleDatePrice(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate?: string
): Promise<number | null> {
    try {
        const params: Record<string, string> = {
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate,
            adults: "1",
            max: "1",
        }

        if (returnDate) {
            params.returnDate = returnDate
        }

        const response = await amadeus.shopping.flightOffersSearch.get(params)

        const offer = response?.data?.[0]
        if (!offer?.price?.total) return null

        const total = parseFloat(offer.price.total)
        if (Number.isNaN(total)) return null

        const currency = offer.price.currency || "USD"
        return currency === "USD" ? total : await convertToUSD(total, currency)
    } catch {
        return null
    }
}

// Fetch prices by sampling dates
async function fetchPriceCalendar(params: {
    origin: string
    destination: string
    month: string
    tripType: "one-way" | "round-trip"
    tripDuration: number
}): Promise<Record<string, number>> {
    const parsedMonth = parse(`${params.month}-01`, "yyyy-MM-dd", new Date())

    if (Number.isNaN(parsedMonth.getTime())) {
        throw new Error("Invalid month format. Use YYYY-MM")
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthStart = startOfMonth(parsedMonth)
    const monthEnd = endOfMonth(parsedMonth)

    // Get all days in the month that are today or later
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter((d) => d >= today)

    if (allDays.length === 0) return {}

    // Sample every 2-3 days for better coverage
    const sampled: Date[] = []
    const step = Math.max(2, Math.floor(allDays.length / 12))

    for (let i = 0; i < allDays.length; i += step) {
        sampled.push(allDays[i])
    }

    // Ensure last day is included
    const lastDay = allDays[allDays.length - 1]
    if (!sampled.includes(lastDay)) {
        sampled.push(lastDay)
    }

    // Limit to max 12 samples
    const toFetch = sampled.slice(0, 12)

    const prices: Record<string, number> = {}

    // Fetch in parallel
    const results = await Promise.allSettled(
        toFetch.map(async (date) => {
            const dateStr = format(date, "yyyy-MM-dd")
            
            // For round-trip, use the specified trip duration
            let returnDateStr: string | undefined
            if (params.tripType === "round-trip") {
                const returnDate = new Date(date)
                returnDate.setDate(returnDate.getDate() + params.tripDuration)
                returnDateStr = format(returnDate, "yyyy-MM-dd")
            }

            const price = await fetchSingleDatePrice(
                params.origin, 
                params.destination, 
                dateStr,
                returnDateStr
            )
            return { date: dateStr, price }
        })
    )

    for (const result of results) {
        if (result.status === "fulfilled" && result.value.price !== null) {
            prices[result.value.date] = result.value.price
        }
    }

    // Only interpolate if we have at least 2 data points
    if (Object.keys(prices).length >= 2) {
        const sortedDates = Object.keys(prices).sort()

        for (const day of allDays) {
            const dateStr = format(day, "yyyy-MM-dd")
            if (!prices[dateStr]) {
                // Find nearest sampled dates
                const before = sortedDates.filter((d) => d <= dateStr).pop()
                const after = sortedDates.find((d) => d > dateStr)

                if (before && after) {
                    // Linear interpolation
                    const beforePrice = prices[before]
                    const afterPrice = prices[after]
                    const beforeTime = new Date(before).getTime()
                    const afterTime = new Date(after).getTime()
                    const currentTime = new Date(dateStr).getTime()
                    const ratio = (currentTime - beforeTime) / (afterTime - beforeTime)
                    prices[dateStr] = Math.round(beforePrice + (afterPrice - beforePrice) * ratio)
                } else if (before) {
                    prices[dateStr] = prices[before]
                } else if (after) {
                    prices[dateStr] = prices[after]
                }
            }
        }
    }

    return prices
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)

    const origin = searchParams.get("origin")
    const destination = searchParams.get("destination")
    const month = searchParams.get("month")
    const tripType = (searchParams.get("tripType") || "one-way") as "one-way" | "round-trip"
    const tripDuration = parseInt(searchParams.get("tripDuration") || "7", 10)

    if (!origin || !destination || !month) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const cacheKey = buildCacheKey({ origin, destination, month, tripType, tripDuration })
    const now = Date.now()
    const cached = priceCalendarCache.get(cacheKey)

    if (cached && cached.expiresAt > now) {
        return NextResponse.json(
            { prices: cached.data, currency: "USD", month, tripType, tripDuration },
            {
                headers: {
                    "Cache-Control": `public, max-age=0, s-maxage=${
                        CACHE_TTL_MS / 1000
                    }, stale-while-revalidate=${STALE_TTL_MS / 1000}`,
                },
            }
        )
    }

    if (cached && cached.refreshUntil > now) {
        if (!cached.refreshing) {
            cached.refreshing = fetchPriceCalendar({ origin, destination, month, tripType, tripDuration })
                .then((data) => {
                    priceCalendarCache.set(cacheKey, {
                        data,
                        expiresAt: Date.now() + CACHE_TTL_MS,
                        refreshUntil: Date.now() + STALE_TTL_MS,
                    })
                    return data
                })
                .catch(() => {
                    cached.refreshing = undefined
                    return cached.data
                })
        }

        return NextResponse.json(
            { prices: cached.data, currency: "USD", month, tripType, tripDuration, stale: true },
            {
                headers: {
                    "Cache-Control": `public, max-age=0, s-maxage=${
                        CACHE_TTL_MS / 1000
                    }, stale-while-revalidate=${STALE_TTL_MS / 1000}`,
                },
            }
        )
    }

    try {
        const prices = await fetchPriceCalendar({ origin, destination, month, tripType, tripDuration })

        priceCalendarCache.set(cacheKey, {
            data: prices,
            expiresAt: now + CACHE_TTL_MS,
            refreshUntil: now + STALE_TTL_MS,
        })

        return NextResponse.json(
            { prices, currency: "USD", month, tripType, tripDuration },
            {
                headers: {
                    "Cache-Control": `public, max-age=0, s-maxage=${
                        CACHE_TTL_MS / 1000
                    }, stale-while-revalidate=${STALE_TTL_MS / 1000}`,
                },
            }
        )
    } catch (error) {
        const err = error as {
            message?: string
            response?: { statusCode?: number }
        }

        if (process.env.NODE_ENV === "development") {
            console.error("Price calendar API error:", err?.message)
        }

        return NextResponse.json(
            { error: "Failed to fetch price calendar" },
            { status: err?.response?.statusCode || 500 }
        )
    }
}
