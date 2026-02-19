import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Session, CreateSessionOptions } from "../../preload/types";

interface SessionContextValue {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  createSession: (opts: CreateSessionOptions) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshSession: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error("useSessionContext must be used within SessionProvider");
  return ctx;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    const list = await window.electronAPI.sessionList();
    setSessions(list);
  }, []);

  const refreshSession = useCallback(async (sessionId: string) => {
    const session = await window.electronAPI.sessionGet(sessionId);
    if (!session) return;
    setSessions((prev) =>
      prev.map((s) => (s.sessionId === sessionId ? session : s)),
    );
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const handleCreate = useCallback(
    async (opts: CreateSessionOptions): Promise<Session> => {
      const session = await window.electronAPI.sessionCreate(opts);
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.sessionId);
      return session;
    },
    [],
  );

  const handleDelete = useCallback(async (sessionId: string) => {
    await window.electronAPI.sessionDelete(sessionId);
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    setActiveSessionId((prev) => (prev === sessionId ? null : prev));
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        setActiveSessionId,
        createSession: handleCreate,
        deleteSession: handleDelete,
        refreshSessions,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
