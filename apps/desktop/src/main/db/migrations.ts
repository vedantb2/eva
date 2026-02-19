import type Database from "better-sqlite3";

interface Migration {
  version: number;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE sessions (
          session_id TEXT PRIMARY KEY,
          repo_path TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          active_tab_id TEXT NOT NULL DEFAULT '',
          last_opened_at INTEGER NOT NULL,
          pinned INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE tabs (
          tab_id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
          pty_id TEXT NOT NULL,
          tool TEXT NOT NULL,
          label TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE INDEX idx_tabs_session_id ON tabs(session_id);

        CREATE TABLE preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma("user_version", { simple: true });
  const version = typeof currentVersion === "number" ? currentVersion : 0;

  const pending = migrations.filter((m) => m.version > version);
  if (pending.length === 0) return;

  const transaction = db.transaction(() => {
    for (const migration of pending) {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    }
  });

  transaction();
}
