import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import {
  isGlobalSettingsPath,
  isHomePath,
} from "@/lib/components/sidebar/homePaths";
import { SessionChromeTabsBar } from "@/lib/components/sidebar/session-tabs/SessionChromeTabsBar";
import { useChromeSessionTabsActive } from "@/lib/components/sidebar/session-tabs/useChromeSessionTabs";
import { cn } from "@eva/ui";

export const Route = createFileRoute("/_global")({
  beforeLoad: ({ context }) => {
    if (!context.isSignedIn) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { appShell: true },
  component: GlobalMainContent,
});

function GlobalMainContent() {
  const { pathname } = useLocation();
  const { collapsed } = useSidebar();
  const isSessionsLanding =
    pathname === "/sessions" || pathname === "/sessions/";
  const isAutomationsLanding =
    pathname === "/automations" || pathname === "/automations/";
  const chromeSessionTabs = useChromeSessionTabsActive(pathname);
  const onTesting =
    import.meta.env.DEV &&
    (pathname === "/testing" || pathname.startsWith("/testing/"));
  // The orchestrator chat is a virtualized session surface: it needs a
  // viewport-clamped shell (like `_repo/$owner/$repo.tsx`'s `h-dvh
  // overflow-hidden`), not this layout's content-sized `min-h-dvh` column —
  // an unclamped ancestor makes the chat virtualizer's measure loop diverge,
  // growing the page by hundreds of px per second.
  const isOrchestratorPath =
    pathname === "/orchestrator" || pathname.startsWith("/orchestrator/");
  // Sessions / automations / home / root settings show the wide second column;
  // collapsed = rail only. Chrome session tabs use rail-only (no sidebar).
  const hasSecondColumn =
    (isSessionsLanding && !chromeSessionTabs) ||
    isAutomationsLanding ||
    isHomePath(pathname) ||
    isGlobalSettingsPath(pathname) ||
    onTesting;
  const paddingClass = hasSecondColumn
    ? collapsed
      ? "lg:pl-16"
      : "lg:pl-(--eva-sidebar-width,20rem)"
    : "lg:pl-16";

  return (
    <div
      className={cn(
        // No padding transition: animating pl-* during route changes counts as CLS.
        // `--eva-mobile-header-height` (globals.css), not a literal `pt-14`: the
        // below-`lg` header in `Sidebar.tsx` is 3.5rem *plus* the notch inset.
        "relative flex flex-col pt-(--eva-mobile-header-height) lg:pt-0",
        isOrchestratorPath ? "h-dvh overflow-hidden" : "min-h-dvh",
        paddingClass,
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col bg-background">
        {chromeSessionTabs && isSessionsLanding ? (
          <SessionChromeTabsBar pathname={pathname} />
        ) : null}
        <div
          className={
            isOrchestratorPath
              ? "relative z-10 flex w-full min-h-0 flex-1 flex-col"
              : isGlobalSettingsPath(pathname)
                ? "relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col"
                : "relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8"
          }
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
