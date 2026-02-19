import { watch, type FSWatcher } from "chokidar";
import type { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc-channels";

interface WatcherRecord {
  watcher: FSWatcher;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

const watchers = new Map<string, WatcherRecord>();

export function startWatching(repoPath: string, win: BrowserWindow): void {
  if (watchers.has(repoPath)) return;

  const watcher = watch(repoPath, {
    ignored: [
      /(^|[/\\])\../, // dotfiles
      "**/node_modules/**",
      "**/.git/**",
    ],
    persistent: true,
    ignoreInitial: true,
    depth: 10,
  });

  const record: WatcherRecord = { watcher, debounceTimer: null };

  function notifyChange() {
    if (record.debounceTimer) clearTimeout(record.debounceTimer);
    record.debounceTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.GIT_WATCH_CHANGED, repoPath);
      }
    }, 1500);
  }

  watcher.on("add", notifyChange);
  watcher.on("change", notifyChange);
  watcher.on("unlink", notifyChange);
  watcher.on("addDir", notifyChange);
  watcher.on("unlinkDir", notifyChange);

  watchers.set(repoPath, record);
}

export function stopWatching(repoPath: string): void {
  const record = watchers.get(repoPath);
  if (!record) return;
  if (record.debounceTimer) clearTimeout(record.debounceTimer);
  record.watcher.close();
  watchers.delete(repoPath);
}

export function stopAllWatchers(): void {
  for (const [, record] of watchers) {
    if (record.debounceTimer) clearTimeout(record.debounceTimer);
    record.watcher.close();
  }
  watchers.clear();
}
