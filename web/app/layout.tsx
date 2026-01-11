import type { Metadata } from "next";
import "./globals.css";
import { Instrument_Serif, Instrument_Sans, Michroma } from "next/font/google";
import { ClientProvider } from "../lib/components/ClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Conductor - Kanban for AI Agents",
  description:
    "Orchestrate AI agents with a Kanban-style interface. Manage tasks, trigger agent runs, and track execution in real-time.",
  keywords:
    "ai agents, llm orchestration, kanban, task automation, agent execution",
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
  themeColor: "#db2777",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Conductor",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Conductor",
    title: "Conductor - Kanban for AI Agents",
    description:
      "Orchestrate AI agents with a Kanban-style interface. Manage tasks, trigger agent runs, and track execution in real-time.",
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
