import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import { runMigrations } from "./migrations";

let db: Database.Database | null = null;

export function initDatabase(): void {
  const dbPath = join(app.getPath("userData"), "evacode.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
