/**
 * Groq API Client for AI-powered flight search
 * Uses Groq's OpenAI-compatible chat completions endpoint
 */

import type { FlightSearchIntent } from "@/lib/ai-types";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface GroqResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export const GROQ_MODELS = {
    LLAMA_3_1_8B: "llama-3.1-8b-instant",
    LLAMA_3_1_70B: "llama-3.1-70b-versatile",
} as const;

export class GroqClient {
    private apiKey: string;
    private baseURL = "https://api.groq.com/openai/v1";
    private defaultModel = GROQ_MODELS.LLAMA_3_1_8B;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(
        messages: ChatMessage[],
        model: string = this.defaultModel,
        temperature: number = 0.7,
        maxTokens: number = 1000
    ): Promise<GroqResponse> {
        const body = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
        };

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    /**
     * Extract flight search intent from natural language query
     */
    async extractFlightIntent(userQuery: string): Promise<FlightSearchIntent> {
        const systemPrompt = `You are a flight search assistant. Extract structured flight search parameters from natural language queries.

Current date: ${new Date().toISOString().split("T")[0]}

Respond ONLY with a valid JSON object (no markdown, no code blocks) with these fields:
- origin: departure city/airport code (if mentioned)
- destination: arrival city/airport code (if mentioned)  
- departureDate: YYYY-MM-DD format (if mentioned, convert relative dates like "next week" to actual dates)
- returnDate: YYYY-MM-DD format (if mentioned)
- adults: number of passengers (default 1)
- travelClass: "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", or "FIRST" (if mentioned)
- intent: "search" (specific search), "explore" (general browsing), or "recommend" (asking for suggestions)
- preferences: array of strings like ["direct flights", "cheapest", "fastest", "morning departure"]

Examples:
Query: "I want to fly from New York to London next Friday"
Response: {"origin":"NYC","destination":"LON","departureDate":"2026-01-23","adults":1,"travelClass":"ECONOMY","intent":"search","preferences":[]}

Query: "Cheapest round trip to Tokyo in March"
Response: {"destination":"TYO","departureDate":"2026-03-01","adults":1,"travelClass":"ECONOMY","intent":"search","preferences":["cheapest","round trip"]}

Query: "Where can I travel in Europe for under $500?"
Response: {"destination":"Europe","adults":1,"travelClass":"ECONOMY","intent":"recommend","preferences":["budget friendly","under $500"]}`;

        const messages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery },
        ];

        const response = await this.chat(messages, this.defaultModel, 0.2, 800);
        const content = response.choices[0]?.message?.content || "{}";

        const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        try {
            return JSON.parse(cleanContent);
        } catch (error) {
            console.error("Failed to parse AI response:", cleanContent);
            return { intent: "search" };
        }
    }

    /**
     * Generate conversational response for flight search
     */
    async generateResponse(userQuery: string, context?: string): Promise<string> {
        const systemPrompt = `You are a helpful flight search assistant. Help users find flights naturally and conversationally.
Be concise, friendly, and guide them through their search. If they ask vague questions, help them narrow down options.
Current date: ${new Date().toISOString().split("T")[0]}`;

        const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

        if (context) {
            messages.push({ role: "assistant", content: context });
        }

        messages.push({ role: "user", content: userQuery });

        const response = await this.chat(messages, this.defaultModel, 0.7, 1000);
        return response.choices[0]?.message?.content || "I can help you search for flights. Where would you like to go?";
    }
}

let groqClient: GroqClient | null = null;

export function getGroqClient(): GroqClient {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is not set in environment variables");
        }
        groqClient = new GroqClient(apiKey);
    }
    return groqClient;
}
