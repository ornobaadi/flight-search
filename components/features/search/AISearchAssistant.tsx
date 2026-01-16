"use client"

import * as React from "react"
import { MessageCircle, Send, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FlightSearchIntent } from "@/lib/ai-types"

interface AISearchAssistantProps {
    onSearchIntent?: (intent: FlightSearchIntent) => void;
    className?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    intent?: FlightSearchIntent;
}

export function AISearchAssistant({ onSearchIntent, className }: AISearchAssistantProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [messages, setMessages] = React.useState<Message[]>([])
    const [input, setInput] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const quickPrompts = [
        "Find me cheap flights to Tokyo next month",
        "Show me direct flights from NYC to London",
        "Weekend getaway from LAX",
        "Business class to Paris in March"
    ]

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async (content: string) => {
        if (!content.trim() || loading) return

        const userMessage: Message = { role: 'user', content }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            // Extract flight intent from natural language
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: content, action: 'extract' })
            })

            const data = await response.json()

            if (data.error) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Sorry, I encountered an error: ${data.error}`
                }])
                return
            }

            const intent: FlightSearchIntent = data.intent

            // Generate conversational response based on extracted intent
            let assistantMessage = ''
            
            if (intent.intent === 'recommend') {
                assistantMessage = `I can help you find ${intent.destination || 'great destinations'}! Let me know more about your preferences:\n\n`
                if (intent.preferences && intent.preferences.length > 0) {
                    assistantMessage += `I see you're looking for: ${intent.preferences.join(', ')}\n\n`
                }
                assistantMessage += `To search for specific flights, you can use the search form above, or tell me:\n• Where you want to fly from\n• Your travel dates\n• Number of passengers`
            } else if (intent.intent === 'explore') {
                assistantMessage = `Great! Let's explore ${intent.destination || 'travel options'}. Use the search form above to browse flights, or give me more specific details like:\n\n• Your departure city\n• Preferred travel dates\n• Budget or travel class`
            } else {
                // Specific search intent
                assistantMessage = '✈️ I found your search intent:\n\n'
                
                if (intent.origin) assistantMessage += `📍 From: ${intent.origin}\n`
                if (intent.destination) assistantMessage += `📍 To: ${intent.destination}\n`
                if (intent.departureDate) assistantMessage += `📅 Departure: ${intent.departureDate}\n`
                if (intent.returnDate) assistantMessage += `📅 Return: ${intent.returnDate}\n`
                if (intent.adults) assistantMessage += `👤 Passengers: ${intent.adults}\n`
                if (intent.travelClass && intent.travelClass !== 'ECONOMY') {
                    assistantMessage += `💺 Class: ${intent.travelClass}\n`
                }
                
                if (intent.preferences && intent.preferences.length > 0) {
                    assistantMessage += `\n✨ Preferences: ${intent.preferences.join(', ')}\n`
                }

                assistantMessage += '\n✅ Click "Apply Search" below to fill the search form!'
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: assistantMessage,
                intent
            }])

            // Trigger search intent callback if provided
            if (intent.intent === 'search' && onSearchIntent) {
                onSearchIntent(intent)
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I had trouble understanding that. Could you try rephrasing?'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await sendMessage(input)
    }

    const applyIntent = (intent: FlightSearchIntent) => {
        if (onSearchIntent) {
            onSearchIntent(intent)
            setIsOpen(false)
        }
    }

    return (
        <div className={cn("relative", className)}>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/90 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">Assistant</span>
                </button>
            )}

            {/* Chat Interface */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-display">Flight Assistant</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Groq</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-3",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                                        <MessageCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 max-w-[80%]">
                                    <div
                                        className={cn(
                                            "px-4 py-3 rounded-2xl whitespace-pre-line",
                                            message.role === 'user'
                                                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-br-md"
                                                : "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-md"
                                        )}
                                    >
                                        {message.content}
                                    </div>
                                    {message.intent && message.intent.intent === 'search' && (
                                        <button
                                            onClick={() => applyIntent(message.intent!)}
                                            className="self-start px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            ✅ Apply Search
                                        </button>
                                    )}
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">You</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-md">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-300" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick prompts */}
                    <div className="px-4 pb-2">
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => sendMessage(prompt)}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me about flights..."
                                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-600/40 transition-all placeholder:text-slate-400"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="p-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 dark:bg-slate-100 dark:hover:bg-white dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white dark:text-slate-900 rounded-xl transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
