import type { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc-channels";
import { addWorktree, removeWorktree } from "../git/worktree";
import { spawnPty, writePty, killPty } from "../pty/manager";
import type { AgentInfo, AgentStatus } from "../../preload/types";

interface AgentRecord extends AgentInfo {
  // internal fields not exposed to renderer
}

const agentMap = new Map<string, AgentRecord>();

function emitStatus(
  win: BrowserWindow,
  agentId: string,
  status: AgentStatus,
): void {
  if (!win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.AGENT_STATUS, agentId, status);
  }
  const record = agentMap.get(agentId);
  if (record) {
    record.status = status;
  }
}

export async function spawnAgent(
  win: BrowserWindow,
  agentId: string,
  repoPath: string,
  branchName: string,
  baseBranch: string,
  prompt: string,
  model = "claude-sonnet-4-5",
  useWorktree = true,
): Promise<string> {
  let cwd: string;
  let worktreePath: string;

  if (useWorktree) {
    worktreePath = await addWorktree(repoPath, agentId, branchName, baseBranch);
    cwd = worktreePath;
  } else {
    worktreePath = "";
    cwd = repoPath;
  }

  const ptyId = `agent-pty-${agentId}`;

  spawnPty(ptyId, cwd, 220, 50, {}, win);

  agentMap.set(agentId, {
    agentId,
    repoPath,
    branchName,
    worktreePath,
    ptyId,
    status: "running",
    startedAt: Date.now(),
    prompt,
  });

  emitStatus(win, agentId, "running");

  setTimeout(() => {
    const escapedPrompt = prompt.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    writePty(ptyId, `claude --model ${model} --print "${escapedPrompt}"\r`);
  }, 500);

  return cwd;
}

export async function killAgent(
  win: BrowserWindow,
  agentId: string,
): Promise<void> {
  const record = agentMap.get(agentId);
  if (!record) return;

  killPty(record.ptyId);

  if (record.worktreePath) {
    try {
      await removeWorktree(record.worktreePath);
    } catch {
      // Worktree may already be removed or repo may be dirty — ignore
    }
  }

  emitStatus(win, agentId, "killed");
  agentMap.delete(agentId);
}

export function listAgents(): AgentInfo[] {
  return Array.from(agentMap.values());
}
