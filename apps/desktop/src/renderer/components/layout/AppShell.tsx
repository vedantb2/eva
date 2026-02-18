import { createContext, useContext, useState, useEffect } from "react";
import type { AgentInfo, AgentStatus } from "../../../preload/types";
import { SessionSidebar } from "./SessionSidebar";

interface AgentsContextValue {
  agents: AgentInfo[];
  onAgentSpawned: (agent: AgentInfo) => void;
  onAgentKilled: (agentId: string) => void;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

export function useAppShell(): AgentsContextValue {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShell");
  return ctx;
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);

  useEffect(() => {
    window.electronAPI.agentList().then(setAgents);

    const cleanup = window.electronAPI.onAgentStatus(
      (agentId: string, status: AgentStatus) => {
        setAgents((prev) =>
          prev.map((a) => (a.agentId === agentId ? { ...a, status } : a)),
        );
      },
    );

    return cleanup;
  }, []);

  function handleAgentSpawned(agent: AgentInfo) {
    setAgents((prev) => [agent, ...prev]);
  }

  function handleAgentKilled(agentId: string) {
    setAgents((prev) =>
      prev.map((a) =>
        a.agentId === agentId ? { ...a, status: "killed" as AgentStatus } : a,
      ),
    );
  }

  return (
    <AgentsContext.Provider
      value={{
        agents,
        onAgentSpawned: handleAgentSpawned,
        onAgentKilled: handleAgentKilled,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <SessionSidebar agents={agents} onKill={handleAgentKilled} />
        <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
      </div>
    </AgentsContext.Provider>
  );
}
