# Plan: Add SQLite Persistence to Desktop App

## Context

The desktop app (`apps/desktop/`) is a terminal manager for AI coding tools. Currently **all state is in-memory** — sessions, tabs, and preferences are lost on every app restart. This makes the app frustrating to use since you lose your entire workspace each time.

We'll add local SQLite persistence via `better-sqlite3` so sessions survive restarts, user preferences are remembered, and recent repos are tracked.

## Approach

Replace the in-memory `Map<string, Session>` store with a SQLite-backed store. Same exported API, same function signatures — all callers (handlers, tab-spawner, index.ts) remain unchanged. Add new IPC channels for preferences, recent repos, and session restore.

## Files to Change

### New Files (3)

| File                        | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `src/main/db/database.ts`   | DB init (WAL mode, foreign keys), connection getter, close      |
| `src/main/db/migrations.ts` | Version-stamped migrations using `PRAGMA user_version`          |
| `src/main/db/queries.ts`    | All prepared statement wrappers for sessions, tabs, preferences |

### Modified Files (9)

| File                              | Change                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `package.json`                    | Add `better-sqlite3` + `@types/better-sqlite3`                               |
| `electron-builder.config.js`      | Add `better-sqlite3` to `asarUnpack`                                         |
| `src/main/session/store.ts`       | Rewrite: SQLite-backed instead of Map (same exports)                         |
| `src/main/session/tab-spawner.ts` | Add `respawnTab()` for restoring tabs without creating new DB rows           |
| `src/main/index.ts`               | Add `initDatabase()`/`closeDatabase()`, stop deleting sessions on quit       |
| `src/main/ipc/handlers.ts`        | Add `session:restore`, `preferences:get/set`, `session:recentRepos` handlers |
| `src/shared/ipc-channels.ts`      | Add 4 new channel constants                                                  |
| `src/preload/types.ts`            | Extend `ElectronAPI` with new methods                                        |
| `src/preload/index.ts`            | Wire new IPC methods                                                         |

### Renderer Changes (3)

| File                                       | Change                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `src/renderer/contexts/SessionContext.tsx` | Add `restoreSession()` method                                          |
| `src/renderer/pages/SessionPage.tsx`       | Call `sessionRestore` on mount to re-spawn PTYs for persisted sessions |
| `src/renderer/pages/HomePage.tsx`          | Show recent repos section for quick access                             |

## Implementation Steps

### Step 1: Install dependencies

```bash
cd apps/desktop && pnpm add better-sqlite3 && pnpm add -D @types/better-sqlite3
```

### Step 2: Update electron-builder config

Add `better-sqlite3` to `asarUnpack` in `electron-builder.config.js` (native module, like node-pty).

### Step 3: Create `src/main/db/database.ts`

- `initDatabase()` — opens `evacode.db` in `app.getPath('userData')`, enables WAL + foreign keys, runs migrations
- `getDatabase()` — returns the connection (throws if not initialized)
- `closeDatabase()` — closes connection cleanly

### Step 4: Create `src/main/db/migrations.ts`

Single migration (v0 → v1) creating 3 tables:

**sessions** — `session_id TEXT PK`, `repo_path`, `name`, `created_at INTEGER`, `active_tab_id TEXT`, `last_opened_at INTEGER`, `pinned INTEGER DEFAULT 0`

**tabs** — `tab_id TEXT PK`, `session_id TEXT FK → sessions ON DELETE CASCADE`, `pty_id`, `tool`, `label`, `created_at INTEGER`. Index on `session_id`.

**preferences** — `key TEXT PK`, `value TEXT`

Uses `PRAGMA user_version` for versioning. All migrations run in a single transaction.

### Step 5: Create `src/main/db/queries.ts`

Typed wrappers for all DB operations:

- Session CRUD: `insertSession`, `selectSession`, `selectAllSessions`, `deleteSessionById`, `updateActiveTabId`, `updateLastOpened`
- Tab CRUD: `insertTab`, `deleteTabById`, `selectTabsForSession`
- Preferences: `getPreference`, `setPreference`
- Recent repos: `selectRecentRepos` (derived from sessions table via `SELECT DISTINCT repo_path`)

Row-to-type mappers use a `toolTypeMap` record lookup to convert `string → ToolType` without `as`.

### Step 6: Rewrite `src/main/session/store.ts`

Replace `Map` with SQLite calls. **Same 6 exports, same signatures, same return types:**

- `createSession(repoPath)` → `insertSession()` + return `Session`
- `getSession(sessionId)` → `selectSession()`
- `listSessions()` → `selectAllSessions()` (sorted by `last_opened_at DESC`)
- `deleteSession(sessionId)` → `deleteSessionById()` (CASCADE deletes tabs)
- `addTab(sessionId, tool)` → `insertTab()` + `updateActiveTabId()`
- `removeTab(sessionId, tabId)` → `deleteTabById()` + re-assign active tab
- `setActiveTab(sessionId, tabId)` → `updateActiveTabId()`
- New: `touchSession(sessionId)` → `updateLastOpened()` (updates `last_opened_at`)

### Step 7: Add `respawnTab()` to `src/main/session/tab-spawner.ts`

For session restore — spawns a PTY for an **existing** tab (doesn't create a new DB row):

```
respawnTab(win, tab, repoPath) → spawnPty(tab.ptyId, ...) + write tool command after 300ms
```

The `spawnPty` guard (`if (ptyMap.has(ptyId)) return`) makes this idempotent — safe to call on already-running sessions.

### Step 8: Update `src/main/index.ts`

- Call `initDatabase()` in `app.whenReady()` before `createWindow()`
- In `before-quit`: **remove** the loop that deletes all sessions (they now persist). Keep `stopAllWatchers()` + `killAllPtys()`. Add `closeDatabase()`.

### Step 9: Add new IPC channels + handlers

New channels in `ipc-channels.ts`:

- `SESSION_RESTORE: "session:restore"`
- `PREFERENCES_GET: "preferences:get"`
- `PREFERENCES_SET: "preferences:set"`
- `SESSION_RECENT_REPOS: "session:recentRepos"`

New handlers in `handlers.ts`:

- `SESSION_RESTORE` — calls `touchSession()`, spawns PTYs via `respawnTab()` for each tab, starts git watcher, returns session
- `PREFERENCES_GET/SET` — thin wrappers over query functions
- `SESSION_RECENT_REPOS` — calls `selectRecentRepos(limit)`

### Step 10: Update preload types + bridge

Add to `ElectronAPI` in `types.ts`:

- `sessionRestore: (sessionId: string) => Promise<Session | null>`
- `preferencesGet: (key: string) => Promise<string | null>`
- `preferencesSet: (key: string, value: string) => Promise<void>`
- `recentRepos: (limit: number) => Promise<string[]>`

Wire them in `preload/index.ts`.

### Step 11: Update SessionPage for restore

Add `useEffect` that calls `window.electronAPI.sessionRestore(sessionId)` when the session page mounts. This re-spawns PTYs for persisted tabs. Safe to call on fresh sessions too (PTY already exists, `spawnPty` no-ops).

### Step 12: Update HomePage with recent repos

Fetch recent repos on mount via `window.electronAPI.recentRepos(5)`. Display as clickable items below the session creation form that pre-fill `repoPath` and navigate to session creation.

## Session Restore Flow

```
App restart → SessionProvider calls sessionList() → sidebar shows persisted sessions
  ↓
User clicks session → navigates to /session/:sessionId
  ↓
SessionPage mounts → calls sessionRestore(sessionId)
  ↓
Main handler: touchSession() + respawnTab() for each tab + startWatching()
  ↓
PTYs spawn → tool commands written after 300ms
  ↓
TerminalView listeners receive PTY data → terminals come alive
```

## What's NOT Persisted

- Terminal output (ephemeral, owned by CLI tools — will be blank on restore)
- PTY processes (re-spawned on demand)
- Git status (queried on-demand, already works)

## Verification

1. `cd apps/desktop && pnpm dev` — app should start, create sessions, quit, restart, and see sessions in sidebar
2. Click a persisted session → terminals should re-spawn with the correct tool
3. `npx tsc --noEmit -p tsconfig.node.json` — main process types pass
4. `npx tsc --noEmit -p tsconfig.json` — renderer types pass
5. Verify no `any`, `unknown`, or `as` in new code (except the `as const` on IPC_CHANNELS which already exists)
