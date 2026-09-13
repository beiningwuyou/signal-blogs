import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const migrations = [{ version: 1, sql: `
CREATE TABLE sources (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('rss','podcast','video')),
  category TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL, last_success_at TEXT, last_attempt_at TEXT,
  error TEXT, etag TEXT, modified TEXT
);
CREATE TABLE events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, normalized_title TEXT NOT NULL,
  summary TEXT NOT NULL, category TEXT NOT NULL, updated_at TEXT,
  discovered_at TEXT NOT NULL, evidence_level TEXT NOT NULL DEFAULT 'metadata',
  inference TEXT, inference_material_ids TEXT, research_job_id TEXT
);
CREATE INDEX events_updated ON events(updated_at DESC);
CREATE INDEX events_title ON events(normalized_title);
CREATE TABLE materials (
  id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id),
  identity TEXT NOT NULL, title TEXT NOT NULL, original_url TEXT, published_at TEXT,
  description TEXT NOT NULL, content TEXT NOT NULL, fingerprint TEXT NOT NULL,
  evidence_level TEXT NOT NULL, fetched_at TEXT NOT NULL,
  UNIQUE(source_id, identity)
);
CREATE INDEX materials_url ON materials(original_url);
CREATE TABLE event_materials (
  event_id TEXT NOT NULL REFERENCES events(id), material_id TEXT NOT NULL REFERENCES materials(id),
  PRIMARY KEY(event_id, material_id), UNIQUE(material_id)
);
CREATE TABLE event_records (
  event_id TEXT PRIMARY KEY REFERENCES events(id), bookmarked INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '', read INTEGER NOT NULL DEFAULT 0,
  visited_at TEXT, revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE jobs (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('fetch','research')),
  state TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT,
  total INTEGER NOT NULL, done INTEGER NOT NULL DEFAULT 0, succeeded INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0, new_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0, tool TEXT NOT NULL DEFAULT 'metadata',
  parent_id TEXT, error TEXT
);
CREATE UNIQUE INDEX one_running_job_per_kind ON jobs(kind) WHERE state = 'running';
CREATE TABLE job_sources (
  job_id TEXT NOT NULL REFERENCES jobs(id), source_id TEXT NOT NULL REFERENCES sources(id),
  state TEXT NOT NULL DEFAULT 'pending', error TEXT, material_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(job_id, source_id)
);
CREATE TABLE event_changes (
  id INTEGER PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id),
  material_id TEXT NOT NULL REFERENCES materials(id), job_id TEXT NOT NULL REFERENCES jobs(id),
  kind TEXT NOT NULL CHECK(kind IN ('new','updated')), description TEXT NOT NULL, occurred_at TEXT,
  UNIQUE(event_id, material_id, job_id, kind)
);
CREATE TABLE app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
` }, {version:2,sql:`
CREATE TABLE job_events (
  job_id TEXT NOT NULL REFERENCES jobs(id), event_id TEXT NOT NULL REFERENCES events(id),
  PRIMARY KEY(job_id,event_id)
);
INSERT OR IGNORE INTO job_events SELECT job_id,event_id FROM event_changes;
INSERT OR IGNORE INTO job_events SELECT research_job_id,id FROM events WHERE research_job_id IN (SELECT id FROM jobs);
`}];

export function migrateDatabase(db, dataDir, existingDatabase) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const version = db.prepare('SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations').get().version;
  const pending = migrations.filter(migration => migration.version > version);
  if (!pending.length) return;
  if (existingDatabase) {
    const backups = path.join(dataDir, 'backups');
    mkdirSync(backups, { recursive: true, mode: 0o700 });
    const backupPath = path.join(backups, `before-v${pending.at(-1).version}-${Date.now()}.sqlite`);
    // VACUUM INTO creates a consistent backup including the WAL, while readers remain safe.
    if (existsSync(backupPath)) throw new Error('迁移备份文件已存在');
    db.prepare('VACUUM INTO ?').run(backupPath);
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const migration of pending) {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(migration.version, new Date().toISOString());
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
