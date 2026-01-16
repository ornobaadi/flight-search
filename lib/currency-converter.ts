/**
 * Currency conversion utility
 * Uses exchangerate-api.com for real-time exchange rates
 */

interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
}

// Cache exchange rates for 1 hour
let cachedRates: ExchangeRates | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates from API
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        return {
            base: data.base,
            rates: data.rates,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return fallback rates if API fails
        return {
            base: 'USD',
            rates: {
                USD: 1,
                EUR: 0.92,
                GBP: 0.79,
                JPY: 149.50,
                CAD: 1.36,
                AUD: 1.53,
                CHF: 0.88,
                CNY: 7.24,
                INR: 83.12,
                MXN: 17.08
            },
            timestamp: Date.now()
        };
    }
}

/**
 * Get exchange rates (cached or fresh)
 */
async function getExchangeRates(): Promise<ExchangeRates> {
    // Return cached rates if still valid
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
        return cachedRates;
    }

    // Fetch fresh rates
    cachedRates = await fetchExchangeRates();
    return cachedRates;
}

/**
 * Convert amount from one currency to USD
 */
export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    // If already USD, return as is
    if (fromCurrency === 'USD') {
        return amount;
    }

    const rates = await getExchangeRates();
    
    // Get the exchange rate for the source currency
    const fromRate = rates.rates[fromCurrency];
    
    if (!fromRate) {
        console.warn(`Exchange rate not found for ${fromCurrency}, returning original amount`);
        return amount;
    }

    // Convert to USD
    // If USD to other currency rate is X, then other currency to USD rate is 1/X
    const usdAmount = amount / fromRate;
    
    return Math.round(usdAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'CHF',
        CNY: '¥',
        INR: '₹',
        MXN: 'MX$'
    };
    return symbols[currency] || currency;
}
