import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SkyScout - Best Flight Deals",
    template: "%s | SkyScout"
  },
  description: "Compare and book flights from hundreds of airlines. Find the best deals on one-way and round-trip flights with SkyScout's powerful search engine.",
  keywords: ["flights", "flight booking", "cheap flights", "airline tickets", "flight deals", "travel", "SkyScout"],
  authors: [{ name: "SkyScout" }],
  creator: "SkyScout",
  publisher: "SkyScout",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://skyscout.app'),
  openGraph: {
    title: "SkyScout - Find the Best Flight Deals",
    description: "Compare and book flights from hundreds of airlines. Find the best deals on flights worldwide.",
    url: 'https://skyscout.app',
    siteName: 'SkyScout',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SkyScout - Flight Search Engine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "SkyScout - Find the Best Flight Deals",
    description: "Compare and book flights from hundreds of airlines worldwide.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
