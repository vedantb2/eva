import {
  SessionProvider,
  useSessionContext,
} from "../../contexts/SessionContext";
import { DiffTabProvider } from "../../contexts/DiffTabContext";
import { SessionSidebar } from "./SessionSidebar";
import { GitPanel } from "../git/GitPanel";
import { useLocation } from "react-router-dom";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const { sessions, activeSessionId } = useSessionContext();
  const location = useLocation();

  const sessionMatch = /^\/session\/(.+)$/.exec(location.pathname);
  const currentSessionId = sessionMatch?.[1] ?? activeSessionId;
  const currentSession = sessions.find((s) => s.sessionId === currentSessionId);

  return (
    <DiffTabProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <SessionSidebar />
        <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        {currentSession && <GitPanel repoPath={currentSession.repoPath} />}
      </div>
    </DiffTabProvider>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SessionProvider>
      <AppShellInner>{children}</AppShellInner>
    </SessionProvider>
  );
}
