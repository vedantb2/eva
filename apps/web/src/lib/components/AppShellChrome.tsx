import type { ReactNode } from "react";
import { AuthGate } from "@/lib/components/ClientProvider";
import { FollowOverlay } from "@/lib/components/FollowOverlay";
import { Sidebar } from "@/lib/components/Sidebar";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";
import { UpdateAvailableToast } from "@/lib/components/UpdateAvailableToast";
import { FollowProvider } from "@/lib/contexts/FollowContext";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import { PageTitleProvider } from "@/lib/contexts/PageTitleContext";
import { SearchProvider } from "@/lib/contexts/SearchContext";
import { ShortcutsProvider } from "@/lib/hotkeys/ShortcutsContext";

/**
 * The signed-in app chrome. Split from `AppShell` so the sidebar, spotlight
 * search (cmdk), hotkeys, avatars and their dependencies live in a lazy chunk
 * instead of the entry — anonymous landing visitors never download them.
 * `main.tsx` warms this chunk at boot when the signed-in hint is set, so app
 * users fetch it in parallel with Clerk's session handshake.
 */
export function AppShellChrome({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="relative min-h-screen bg-app-shell">
        <SidebarProvider>
          <PageTitleProvider>
            {/* Above SearchProvider: its Mod+K registration is a consumer. */}
            <ShortcutsProvider>
              <SearchProvider>
                <FollowProvider>
                  <Sidebar />
                  {children}
                  <SpotlightSearch />
                  <FollowOverlay />
                  <NotificationToastStream />
                  <UpdateAvailableToast />
                </FollowProvider>
              </SearchProvider>
            </ShortcutsProvider>
          </PageTitleProvider>
        </SidebarProvider>
      </div>
    </AuthGate>
  );
}
