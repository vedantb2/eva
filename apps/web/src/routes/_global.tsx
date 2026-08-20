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
  // The two-pane inbox is an app surface (viewport-bound, full-bleed) like the
  // repo shell, not a scrolling document page like the rest of _global.
  const isInbox = pathname === "/inbox" || pathname.startsWith("/inbox/");

  return (
    <div
      className={cn(
        // No padding transition: animating pl-* during route changes counts as CLS.
        "relative flex flex-col pt-14 lg:pt-0",
        isInbox ? "h-screen overflow-hidden" : "min-h-screen",
        paddingClass,
      )}
    >
      <div
        className={cn(
          "relative flex flex-1 flex-col bg-background",
          isInbox && "min-h-0 overflow-hidden",
        )}
      >
        {chromeSessionTabs && isSessionsLanding ? (
          <SessionChromeTabsBar pathname={pathname} />
        ) : null}
        <div
          className={
            isInbox
              ? "relative z-10 flex w-full min-h-0 flex-1 flex-col overflow-hidden"
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
