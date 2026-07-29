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
  const onTesting =
    import.meta.env.DEV &&
    (pathname === "/testing" || pathname.startsWith("/testing/"));
  // Sessions / home / root settings show the wide second column; collapsed =
  // rail only.
  const hasSecondColumn =
    isSessionsLanding ||
    isHomePath(pathname) ||
    isGlobalSettingsPath(pathname) ||
    onTesting;
  const paddingClass = hasSecondColumn
    ? collapsed
      ? "lg:pl-16"
      : "lg:pl-[var(--eva-sidebar-width,20rem)]"
    : "lg:pl-16";

  return (
    <div
      className={cn(
        // No padding transition: animating pl-* during route changes counts as CLS.
        "relative flex min-h-screen flex-col pt-14 lg:pt-0",
        paddingClass,
      )}
    >
      <div className="relative flex flex-1 flex-col bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
