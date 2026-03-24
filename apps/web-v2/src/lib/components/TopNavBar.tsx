"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { UserButton } from "@clerk/clerk-react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button, cn } from "@conductor/ui";
import { NotificationsPopoverClient } from "@/lib/components/NotificationsPopoverClient";
import { useThemeContext } from "@/lib/contexts/ThemeContext";

export function TopNavBar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme, mounted } = useThemeContext();

  const isReposRoute = pathname === "/home" || pathname.startsWith("/setup");
  const isTeamsRoute = pathname.startsWith("/teams");
  const isInboxRoute = pathname.startsWith("/inbox");
  const isThemeRoute = pathname.startsWith("/settings/theme");

  const tabs = [
    { label: "Repositories", to: "/home", active: isReposRoute },
    { label: "Teams", to: "/teams", active: isTeamsRoute },
    { label: "Inbox", to: "/inbox", active: isInboxRoute },
    { label: "Theme", to: "/settings/theme", active: isThemeRoute },
  ];

  return (
    <header className="sticky top-0 z-30 bg-background/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5"
          >
            <img
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

          <nav className="flex items-center gap-1 sm:gap-2">
            {tabs.map((tab) => (
              <Link key={tab.to} to={tab.to}>
                <Button
                  size="sm"
                  variant={tab.active ? "secondary" : "ghost"}
                  className={cn(
                    "h-8 border-0 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm",
                    tab.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Button>
              </Link>
            ))}
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
