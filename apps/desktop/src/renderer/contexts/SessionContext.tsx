import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Session, CreateSessionOptions } from "../../preload/types";

interface SessionListContextValue {
  sessions: Session[];
}

interface SessionActionsContextValue {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  createSession: (opts: CreateSessionOptions) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshSession: (sessionId: string) => Promise<void>;
}

const SessionListContext = createContext<SessionListContextValue | null>(null);
const SessionActionsContext = createContext<SessionActionsContextValue | null>(
  null,
);

export function useSessionList(): SessionListContextValue {
  const ctx = useContext(SessionListContext);
  if (!ctx)
    throw new Error("useSessionList must be used within SessionProvider");
  return ctx;
}

export function useSessionActions(): SessionActionsContextValue {
  const ctx = useContext(SessionActionsContext);
  if (!ctx)
    throw new Error("useSessionActions must be used within SessionProvider");
  return ctx;
}

export function useSessionContext(): SessionListContextValue &
  SessionActionsContextValue {
  return { ...useSessionList(), ...useSessionActions() };
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

  const listValue = useMemo<SessionListContextValue>(
    () => ({ sessions }),
    [sessions],
  );

  const actionsValue = useMemo<SessionActionsContextValue>(
    () => ({
      activeSessionId,
      setActiveSessionId,
      createSession: handleCreate,
      deleteSession: handleDelete,
      refreshSessions,
      refreshSession,
    }),
    [
      activeSessionId,
      handleCreate,
      handleDelete,
      refreshSessions,
      refreshSession,
    ],
  );

  return (
    <SessionListContext.Provider value={listValue}>
      <SessionActionsContext.Provider value={actionsValue}>
        {children}
      </SessionActionsContext.Provider>
    </SessionListContext.Provider>
  );
}
