"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "../contexts/ThemeContext";
import { clientEnv } from "@/env/client";
import { useRouter } from "next/navigation";

if (!clientEnv.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ConvexQueryCacheProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeProvider>
            <HeroUIProvider
              navigate={router.push}
            >
              <ToastProvider placement="top-center" />
              {children}
            </HeroUIProvider>
          </ThemeProvider>
        </NextThemesProvider>
      </ConvexQueryCacheProvider>
    </ConvexProviderWithClerk>
  );
}
