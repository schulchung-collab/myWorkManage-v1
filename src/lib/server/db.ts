import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedSampleData } from "./seed";

/**
 * SQLite 연결 (Node 24 내장 node:sqlite).
 * 파일 위치: 환경변수 DB_PATH, 없으면 <프로젝트>/data/personal-site.db
 */
export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(process.cwd(), "data", "personal-site.db");

const SCHEMA_VERSION = 1;

declare global {
  var __personalSiteDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  // 개발 서버의 HMR 로 모듈이 다시 읽혀도 연결은 하나만 유지
  if (!globalThis.__personalSiteDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA busy_timeout = 5000;");
    migrate(db);
    globalThis.__personalSiteDb = db;
  }
  return globalThis.__personalSiteDb;
}

function migrate(db: DatabaseSync) {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  const version = row.user_version;
  if (version >= SCHEMA_VERSION) return;

  db.exec("BEGIN");
  try {
    if (version < 1) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT    NOT NULL,
          color       TEXT    NOT NULL,
          client      TEXT,
          memo        TEXT,
          sort_order  INTEGER NOT NULL DEFAULT 0,
          created_at  TEXT    NOT NULL,
          updated_at  TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          title       TEXT    NOT NULL,
          start_date  TEXT,
          due_date    TEXT,
          status      TEXT    NOT NULL DEFAULT 'todo'   CHECK (status IN ('todo','doing','done')),
          priority    TEXT    NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
          progress    INTEGER NOT NULL DEFAULT 0        CHECK (progress BETWEEN 0 AND 100),
          memo        TEXT,
          sort_order  INTEGER NOT NULL DEFAULT 0,
          created_at  TEXT    NOT NULL,
          updated_at  TEXT    NOT NULL,
          CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, due_date);
      `);
      // 새 DB 를 처음 만들 때만 샘플 데이터를 넣는다.
      // (사용자가 나중에 프로젝트를 모두 지워도 다시 채워지지 않음)
      seedSampleData(db);
    }
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
