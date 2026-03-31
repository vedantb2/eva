import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { Sidebar } from "@/lib/components/Sidebar";
import { SetupBanner } from "@/lib/components/SetupBanner";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { SearchProvider } from "@/lib/contexts/SearchContext";
import { LiveCursors } from "@/lib/components/LiveCursors";

export const Route = createFileRoute("/_repo/$owner/$repo")({
  component: RepoLayoutInner,
});

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden pt-14 transition-[padding] duration-300 lg:pt-0 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
        <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
          <SetupBanner />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function RepoLayoutInner() {
  const { owner, repo } = Route.useParams();

  return (
    <SidebarProvider>
      <SearchProvider>
        <RepoProvider owner={owner} repoParam={repo}>
          <Sidebar />
          <MainContent>
            <Outlet />
          </MainContent>
          <SpotlightSearch />
          <LiveCursors />
        </RepoProvider>
      </SearchProvider>
    </SidebarProvider>
  );
}
