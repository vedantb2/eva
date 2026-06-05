"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from "@conductor/ui";
import { useClerk } from "@clerk/clerk-react";
import { UserInitials } from "@conductor/shared";
import {
  IconUserCog,
  IconLogout,
  IconSearch,
  IconSun,
  IconMoon,
  IconSelector,
} from "@tabler/icons-react";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { useSearch } from "@/lib/contexts/SearchContext";

interface SidebarUserMenuProps {
  collapsed?: boolean;
  name: string;
  email?: string;
  /** Search only does anything on repo routes, so the item is gated. */
  showSearch?: boolean;
}

/**
 * The footer identity card, doubling as the account menu trigger. Clicking it
 * opens a dropdown with the actions that used to sit beside it (manage account,
 * search, theme toggle) plus sign out.
 */
export function SidebarUserMenu({
  collapsed,
  name,
  email,
  showSearch,
}: SidebarUserMenuProps) {
  const { openUserProfile, signOut } = useClerk();
  const { theme, toggleTheme } = useThemeContext();
  const { openSearch } = useSearch();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <button
            type="button"
            title={name}
            className="mx-auto flex items-center justify-center rounded-lg p-1 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35"
          >
            <UserInitials
              user={{ fullName: name }}
              hideLastSeen
              size="md"
              disableProfileCard
            />
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2 text-left shadow-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35"
          >
            <UserInitials
              user={{ fullName: name }}
              hideLastSeen
              size="lg"
              disableProfileCard
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
                {name}
              </p>
              {email && (
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {email}
                </p>
              )}
            </div>
            <IconSelector
              size={16}
              className="shrink-0 text-muted-foreground"
            />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={collapsed ? "center" : "start"}
        side={collapsed ? "right" : "top"}
        sideOffset={collapsed ? 8 : 4}
        className={cn(
          collapsed
            ? "w-52"
            : "w-[var(--radix-dropdown-menu-trigger-width)] min-w-52",
        )}
      >
        <DropdownMenuItem onSelect={() => void openUserProfile()}>
          <IconUserCog size={16} className="mr-2" />
          Manage account
        </DropdownMenuItem>
        {showSearch && (
          <DropdownMenuItem onSelect={() => openSearch()}>
            <IconSearch size={16} className="mr-2" />
            Search
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => toggleTheme()}>
          {theme === "dark" ? (
            <IconSun size={16} className="mr-2" />
          ) : (
            <IconMoon size={16} className="mr-2" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="text-destructive focus:text-destructive"
        >
          <IconLogout size={16} className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
