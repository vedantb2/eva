import type { Metadata } from "next";
import "./globals.css";
import { Instrument_Serif, Instrument_Sans, Michroma } from "next/font/google";
import { ClientProvider } from "../lib/components/ClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Conductor - LLM Agent Orchestration",
  description:
    "Learn Marathi language and explore Maharashtra's rich culture. Master vocabulary, discover festivals, and use the Marathi calendar with our Duolingo-style learning platform.",
  keywords:
    "learn marathi, marathi language, language learning, duolingo style, vocabulary builder",
  icons: {
    icon: "/icon.png",
    apple: "/icon-192x192.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#eab308",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "शिका",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "शिका",
    title: "शिका - Learn Marathi",
    description:
      "Master Marathi through fun, bite-sized lessons. Build vocabulary, earn XP, and track your progress with our Duolingo-style learning platform.",
  },
};

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const instrumentSans = Instrument_Sans({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

const michroma = Michroma({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-michroma",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${michroma.variable}`}
    >
      <body suppressHydrationWarning className="font-instrumentSans">
        <ClerkProvider>
          <ClientProvider>{children}</ClientProvider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
