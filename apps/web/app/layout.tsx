import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClientProvider } from "../lib/components/ClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

export const metadata: Metadata = {
  title: "Eva - Your New Coworker",
  description:
    "Meet Eva, your new AI coworker. Manage tasks, ship code, and track progress in real-time.",
  keywords:
    "ai coworker, coding assistant, task management, developer tools, code automation",
  icons: {
    icon: "/icon.png",
    apple: "/icon-192x192.png",
  },
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
      "Meet Eva, your new AI coworker. Manage tasks, ship code, and track progress in real-time.",
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
