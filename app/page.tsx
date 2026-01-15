import { FlightSearchForm } from "@/components/features/search/FlightSearchForm";
import { Plane } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-200/20 blur-3xl rounded-full" />
                <div className="absolute bottom-[0%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-200/20 blur-3xl rounded-full" />
            </div>

            <div className="max-w-4xl w-full mb-12 text-center space-y-6 z-10">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-4 border border-indigo-100">
                    <Plane className="w-5 h-5 text-indigo-600 mr-2 fill-indigo-600" />
                    <span className="text-indigo-900 font-bold tracking-tight">SkyScout</span>
                </div>
            </div>

            <div className="w-full max-w-4xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <FlightSearchForm />
            </div>
        </main>
    );
}