import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  Inter,
  Roboto,
  Poppins,
  DM_Sans,
  Space_Grotesk,
} from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
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
      className={`${inter.variable} ${roboto.variable} ${poppins.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${GeistSans.variable}`}
    >
      <body suppressHydrationWarning className="font-sans text-foreground">
        <ClerkProvider
          signInFallbackRedirectUrl="/home"
          signUpFallbackRedirectUrl="/home"
        >
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
