"use strict";
const electron = require("electron");
const path = require("path");
const pty = require("node-pty");
const child_process = require("child_process");
const util = require("util");
const fs = require("fs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: () => e[k],
              },
        );
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const pty__namespace = /* @__PURE__ */ _interopNamespaceDefault(pty);
const IPC_CHANNELS = {
  // PTY / Terminal
  PTY_SPAWN: "pty:spawn",
  PTY_INPUT: "pty:input",
  PTY_RESIZE: "pty:resize",
  PTY_KILL: "pty:kill",
  PTY_DATA: "pty:data",
  PTY_EXIT: "pty:exit",
  // Agent lifecycle
  AGENT_SPAWN: "agent:spawn",
  AGENT_KILL: "agent:kill",
  AGENT_LIST: "agent:list",
  AGENT_STATUS: "agent:status",
  // Git
  GIT_WORKTREE_ADD: "git:worktree:add",
  GIT_WORKTREE_REMOVE: "git:worktree:remove",
  GIT_DIFF: "git:diff",
  GIT_BRANCHES: "git:branches",
  // Dialog
  DIALOG_OPEN_DIRECTORY: "dialog:openDirectory",
  // Shell
  OPEN_IN_FINDER: "shell:openInFinder",
  OPEN_EXTERNAL: "shell:openExternal",
};
const ptyMap = /* @__PURE__ */ new Map();
function spawnPty(ptyId, cwd, cols, rows, env, win) {
  if (ptyMap.has(ptyId)) return;
  const shell =
    process.platform === "win32"
      ? "powershell.exe"
      : (process.env["SHELL"] ?? "/bin/bash");
  const ptyProcess = pty__namespace.spawn(shell, [], {
    name: "xterm-256color",
    cwd,
    cols,
    rows,
    env: { ...process.env, ...env },
  });
  ptyProcess.onData((data) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.PTY_DATA, ptyId, data);
    }
  });
  ptyProcess.onExit(({ exitCode }) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.PTY_EXIT, ptyId, exitCode);
    }
    ptyMap.delete(ptyId);
  });
  ptyMap.set(ptyId, { process: ptyProcess, ptyId });
}
function writePty(ptyId, data) {
  ptyMap.get(ptyId)?.process.write(data);
}
function resizePty(ptyId, cols, rows) {
  ptyMap.get(ptyId)?.process.resize(cols, rows);
}
function killPty(ptyId) {
  const record = ptyMap.get(ptyId);
  if (record) {
    record.process.kill();
    ptyMap.delete(ptyId);
  }
}
function killAllPtys() {
  for (const record of ptyMap.values()) {
    record.process.kill();
  }
  ptyMap.clear();
}
const execFileAsync$1 = util.promisify(child_process.execFile);
function getWorktreePath(repoPath, agentId) {
  return path.join(repoPath, ".worktrees", agentId);
}
async function addWorktree(repoPath, agentId, branchName, baseBranch) {
  const worktreePath = getWorktreePath(repoPath, agentId);
  fs.mkdirSync(path.join(repoPath, ".worktrees"), { recursive: true });
  await execFileAsync$1(
    "git",
    ["worktree", "add", "-b", branchName, worktreePath, baseBranch],
    { cwd: repoPath },
  );
  return worktreePath;
}
async function removeWorktree(worktreePath) {
  await execFileAsync$1("git", ["worktree", "remove", "--force", worktreePath]);
}
const execFileAsync = util.promisify(child_process.execFile);
async function getDiff(repoPath, branch) {
  const args = branch
    ? ["diff", `main...${branch}`, "--unified=3"]
    : ["diff", "--unified=3"];
  const { stdout } = await execFileAsync("git", args, { cwd: repoPath });
  return parseDiff(stdout);
}
async function getBranches(repoPath) {
  const { stdout } = await execFileAsync(
    "git",
    ["branch", "--format=%(refname:short)"],
    { cwd: repoPath },
  );
  return stdout
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}
function parseDiff(raw) {
  const files = [];
  const fileBlocks = raw.split(/^diff --git /m).filter(Boolean);
  for (const block of fileBlocks) {
    const lines = block.split("\n");
    const headerLine = lines[0] ?? "";
    const pathMatch = /b\/(.+)$/.exec(headerLine);
    const path2 = pathMatch?.[1] ?? headerLine;
    let status = "modified";
    if (block.includes("\nnew file mode")) status = "added";
    else if (block.includes("\ndeleted file mode")) status = "deleted";
    else if (block.includes("\nrename to ")) status = "renamed";
    const hunks = parseHunks(lines.slice(4));
    files.push({ path: path2, status, hunks });
  }
  return files;
}
function parseHunks(lines) {
  const hunks = [];
  let current = null;
  let oldLine = 0;
  let newLine = 0;
  for (const line of lines) {
    const hunkHeader = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkHeader) {
      current = { header: line, lines: [] };
      hunks.push(current);
      oldLine = parseInt(hunkHeader[1] ?? "0", 10);
      newLine = parseInt(hunkHeader[2] ?? "0", 10);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+")) {
      const diffLine = {
        type: "addition",
        content: line.slice(1),
        oldLineNo: null,
        newLineNo: newLine++,
      };
      current.lines.push(diffLine);
    } else if (line.startsWith("-")) {
      const diffLine = {
        type: "deletion",
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: null,
      };
      current.lines.push(diffLine);
    } else if (line.startsWith(" ")) {
      const diffLine = {
        type: "context",
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: newLine++,
      };
      current.lines.push(diffLine);
    }
  }
  return hunks;
}
const agentMap = /* @__PURE__ */ new Map();
function emitStatus(win, agentId, status) {
  if (!win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.AGENT_STATUS, agentId, status);
  }
  const record = agentMap.get(agentId);
  if (record) {
    record.status = status;
  }
}
async function spawnAgent(
  win,
  agentId,
  repoPath,
  branchName,
  baseBranch,
  prompt,
  model = "claude-sonnet-4-5",
  useWorktree = true,
) {
  let cwd;
  let worktreePath;
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
async function killAgent(win, agentId) {
  const record = agentMap.get(agentId);
  if (!record) return;
  killPty(record.ptyId);
  if (record.worktreePath) {
    try {
      await removeWorktree(record.worktreePath);
    } catch {}
  }
  emitStatus(win, agentId, "killed");
  agentMap.delete(agentId);
}
function listAgents() {
  return Array.from(agentMap.values());
}
function registerHandlers(win) {
  electron.ipcMain.handle(IPC_CHANNELS.PTY_SPAWN, (_event, opts) => {
    spawnPty(opts.ptyId, opts.cwd, opts.cols, opts.rows, opts.env ?? {}, win);
  });
  electron.ipcMain.on(IPC_CHANNELS.PTY_INPUT, (_event, ptyId, data) => {
    writePty(ptyId, data);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.PTY_RESIZE,
    (_event, ptyId, cols, rows) => {
      resizePty(ptyId, cols, rows);
    },
  );
  electron.ipcMain.handle(IPC_CHANNELS.PTY_KILL, (_event, ptyId) => {
    killPty(ptyId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await electron.dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
  electron.ipcMain.handle(IPC_CHANNELS.AGENT_SPAWN, async (_event, opts) => {
    return spawnAgent(
      win,
      opts.agentId,
      opts.repoPath,
      opts.branchName,
      opts.baseBranch,
      opts.prompt,
      opts.model,
      opts.useWorktree,
    );
  });
  electron.ipcMain.handle(IPC_CHANNELS.AGENT_KILL, async (_event, agentId) => {
    await killAgent(win, agentId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.AGENT_LIST, () => listAgents());
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_WORKTREE_ADD,
    async (_event, opts) => {
      return addWorktree(
        opts.repoPath,
        opts.agentId,
        opts.branchName,
        opts.baseBranch,
      );
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_WORKTREE_REMOVE,
    async (_event, worktreePath) => {
      await removeWorktree(worktreePath);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF,
    async (_event, repoPath, branch) => {
      return getDiff(repoPath, branch);
    },
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.GIT_BRANCHES,
    async (_event, repoPath) => {
      return getBranches(repoPath);
    },
  );
  electron.ipcMain.on(IPC_CHANNELS.OPEN_IN_FINDER, (_event, path2) => {
    electron.shell.showItemInFolder(path2);
  });
  electron.ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL, (_event, url) => {
    electron.shell.openExternal(url);
  });
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    icon: path.join(__dirname, "../../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  registerHandlers(win);
  win.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  return win;
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", async () => {
  const agents = listAgents();
  await Promise.allSettled(
    agents.map((a) => {
      const win = electron.BrowserWindow.getAllWindows()[0];
      if (win) return killAgent(win, a.agentId);
      return Promise.resolve();
    }),
  );
  killAllPtys();
});
