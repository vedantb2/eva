import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClientProvider } from "../lib/components/ClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Eva - Your New Coworker",
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
    title: "Eva",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Eva",
    title: "Eva",
    description:
      "Orchestrate AI agents with a Kanban-style interface. Manage tasks, trigger agent runs, and track execution in real-time.",
  },
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning className="font-inter">
        <ClerkProvider>
          <ClientProvider>{children}</ClientProvider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
