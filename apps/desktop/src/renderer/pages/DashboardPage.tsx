import { useNavigate } from "react-router-dom";
import { ChatInput } from "../components/agents/ChatInput";
import { useAppShell } from "../components/layout/AppShell";
import type { AgentInfo } from "../../preload/types";

export function DashboardPage() {
  const { onAgentSpawned } = useAppShell();
  const navigate = useNavigate();

  function handleSpawned(agent: AgentInfo) {
    onAgentSpawned(agent);
    navigate(`/agent/${agent.agentId}`);
  }

  return <ChatInput onSpawned={handleSpawned} />;
}
