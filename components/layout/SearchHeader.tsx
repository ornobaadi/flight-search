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
            <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
                    <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                    <span className="font-bold text-lg sm:text-xl text-indigo-900 dark:text-indigo-100 font-display">SkyScout</span>
                </Link>

                <div className="flex gap-1 sm:gap-2 items-center">
                    <ThemeToggle />
                    <Button variant="ghost" className="text-xs sm:text-sm px-2 sm:px-4">Sign In</Button>
                </div>
            </div>
        </header>
    )
}
