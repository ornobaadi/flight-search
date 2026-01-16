"use client"

import Link from "next/link";
import { Plane, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";

export function SearchHeader() {
    const searchParams = useSearchParams();
    const origin = searchParams.get("origin") || "Anywhere";
    const destination = searchParams.get("destination") || "Anywhere";
    const dateStr = searchParams.get("date");

    let formattedDate = "";
    if (dateStr) {
        try {
            formattedDate = format(new Date(dateStr), "MMM d");
        } catch (e) {
            formattedDate = dateStr;
        }
    }

    return (
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-30">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Plane className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                    <span className="font-bold text-xl text-indigo-900 dark:text-indigo-100">SkyScout</span>
                </Link>

                {/* Dynamic Compact Search Bar */}
                <div className="hidden md:flex border rounded-full px-4 py-1.5 items-center gap-3 bg-slate-50 dark:bg-slate-700/50 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-slate-200 dark:border-slate-600">
                    <span className="text-slate-900 dark:text-slate-100">{origin}</span>
                    <span className="text-slate-400 dark:text-slate-500">→</span>
                    <span className="text-slate-900 dark:text-slate-100">{destination}</span>
                    {formattedDate && (
                        <>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <span className="text-slate-600 dark:text-slate-400">{formattedDate}</span>
                        </>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900">
                        <Search className="w-3 h-3" />
                    </Button>
                </div>

                <div className="flex gap-2 items-center">
                    <ThemeToggle />
                    <Button variant="ghost">Sign In</Button>
                </div>
            </div>
        </header>
    )
}
