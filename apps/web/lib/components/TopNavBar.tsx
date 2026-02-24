"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button, cn } from "@conductor/ui";
import { NotificationsPopoverClient } from "@/lib/components/NotificationsPopoverClient";
import { useThemeContext } from "@/lib/contexts/ThemeContext";

export function TopNavBar() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useThemeContext();

  const isTeamsRoute = pathname.startsWith("/teams");
  const isReposRoute = pathname === "/" || pathname === "/setup";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5"
          >
            <Image
              src="/icon.png"
              alt="Eva"
              width={30}
              height={30}
              className="rounded-lg"
            />
            <span className="text-lg font-semibold tracking-[-0.02em]">
              Eva
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button
                size="sm"
                variant={isReposRoute ? "secondary" : "ghost"}
                className={cn(
                  "h-9",
                  isReposRoute
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Repositories
              </Button>
            </Link>
            <Link href="/teams">
              <Button
                size="sm"
                variant={isTeamsRoute ? "secondary" : "ghost"}
                className={cn(
                  "h-9",
                  isTeamsRoute
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Teams
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsPopoverClient />

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="motion-press h-9 w-9 hover:scale-[1.03] active:scale-[0.97]"
            title={
              mounted
                ? theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
                : "Toggle theme"
            }
          >
            {mounted ? (
              theme === "dark" ? (
                <IconSun size={18} className="text-muted-foreground" />
              ) : (
                <IconMoon size={18} className="text-muted-foreground" />
              )
            ) : (
              <div className="h-[18px] w-[18px]" />
            )}
          </Button>

          <UserButton />
        </div>
      </div>
    </header>
  );
}
