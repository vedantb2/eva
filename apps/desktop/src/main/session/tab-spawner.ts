import type { BrowserWindow } from "electron";
import type { TerminalTab, ToolType } from "../../preload/types";
import { spawnPty, writePty } from "../pty/manager";
import { addTab } from "./store";

const TOOL_COMMANDS: Record<ToolType, string | null> = {
  claude: "claude",
  opencode: "opencode",
  codex: "codex",
  shell: null,
};

export function spawnTab(
  win: BrowserWindow,
  sessionId: string,
  repoPath: string,
  tool: ToolType,
  initialMessage?: string,
): TerminalTab | null {
  const tab = addTab(sessionId, tool);
  if (!tab) return null;

  spawnPty(tab.ptyId, repoPath, 120, 40, {}, win);

  const command = TOOL_COMMANDS[tool];
  if (command) {
    setTimeout(() => {
      writePty(tab.ptyId, `${command}\r`);

      if (initialMessage) {
        setTimeout(() => {
          writePty(tab.ptyId, `${initialMessage}\r`);
        }, 1500);
      }
    }, 300);
  }

  return tab;
}

export function respawnTab(
  win: BrowserWindow,
  tab: TerminalTab,
  repoPath: string,
): void {
  spawnPty(tab.ptyId, repoPath, 120, 40, {}, win);

  const command = TOOL_COMMANDS[tab.tool];
  if (command) {
    setTimeout(() => {
      writePty(tab.ptyId, `${command}\r`);
    }, 300);
  }
}
