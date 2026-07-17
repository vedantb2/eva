"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@conductor/ui";
import { useClerk } from "@clerk/clerk-react";
import { UserInitials } from "@conductor/shared";
import {
  IconUserCog,
  IconLogout,
  IconSearch,
  IconSun,
  IconMoon,
  IconLoader2,
} from "@tabler/icons-react";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { useSearch } from "@/lib/contexts/SearchContext";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";

interface SidebarUserMenuProps {
  name: string;
  email?: string;
  /** Search only does anything on repo routes, so the item is gated. */
  showSearch?: boolean;
}

/**
 * Avatar-only account menu for the left icon rail. Name/email live in the
 * dropdown; the trigger stays a compact tile like the other rail icons.
 *
 * Sign out is destructive, so it confirms in a dialog (sibling of the
 * dropdown) so the menu can close cleanly before the dialog traps focus.
 */
export function SidebarUserMenu({
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
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={name}
            aria-label={`Account menu for ${name}`}
            className="relative flex size-11 items-center justify-center rounded-lg border border-transparent opacity-75 transition-colors hover:bg-sidebar-accent/50 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35"
          >
            <UserInitials
              user={{ fullName: name }}
              hideLastSeen
              size="md"
              disableProfileCard
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="right"
          sideOffset={8}
          className="w-56"
        >
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium text-foreground">
              {name}
            </p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void openUserProfile()}>
            <IconUserCog size={16} className="mr-2" />
            Manage account
          </DropdownMenuItem>
          {showSearch ? (
            <DropdownMenuItem onSelect={() => openSearch()}>
              <IconSearch size={16} className="mr-2" />
              Search
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => toggleTheme()}>
            <CrossfadeIcon
              show={theme === "dark"}
              trueKey="sun"
              falseKey="moon"
              className="relative mr-2 flex size-4 items-center justify-center"
              whenTrue={<IconSun size={16} />}
              whenFalse={<IconMoon size={16} />}
            />
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
