import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { registerHandlers } from "./ipc/handlers";
import { killAllPtys } from "./pty/manager";
import { listAgents, killAgent } from "./agent/runner";

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    icon: join(__dirname, "../../build/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  registerHandlers(win);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  // Clean up all running agents and their worktrees
  const agents = listAgents();
  await Promise.allSettled(
    agents.map((a) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) return killAgent(win, a.agentId);
      return Promise.resolve();
    }),
  );
  killAllPtys();
});
