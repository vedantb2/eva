"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  IconLoader2,
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
 *
 * Sign out is destructive, so it confirms in a dialog (rendered as a sibling of
 * the dropdown, controlled by `confirmOpen`, so the menu can close cleanly
 * before the dialog traps focus).
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      // On failure, drop the pending state so the user can retry or cancel.
      setIsSigningOut(false);
    }
  };

  return (
    <>
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
              className="flex w-full items-center gap-2.5 rounded-surface border border-sidebar-border bg-sidebar-accent/40 p-2 text-left shadow-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35"
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
            onSelect={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <IconLogout size={16} className="mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !isSigningOut) setConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sign out of your account? You&apos;ll need to sign back in to
            continue.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
            >
              {isSigningOut && (
                <IconLoader2 size={16} className="animate-spin" />
              )}
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
