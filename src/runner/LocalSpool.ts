import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { createRequire } from "node:module";
import type { AgentTaskResult } from "../types.js";

export class LocalSpool {
  private readonly db: SqlStore;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = createSqlStore(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pending_submissions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        artifact_paths_json TEXT NOT NULL DEFAULT '[]',
        submit_attempts INT NOT NULL DEFAULT 0,
        next_submit_after TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  save(result: AgentTaskResult): string {
    const id = `${result.task_id}:${result.attempt_id}`;
    this.db.run(
      `INSERT OR REPLACE INTO pending_submissions
        (id, task_id, attempt_id, payload_json, artifact_paths_json, next_submit_after, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        result.task_id,
        result.attempt_id,
        JSON.stringify(result),
        JSON.stringify(result.artifacts ?? []),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    return id;
  }

  due(): Array<{ id: string; payload: AgentTaskResult }> {
    return this.db
      .all("SELECT id, payload_json FROM pending_submissions WHERE next_submit_after <= ? ORDER BY created_at ASC", [
        new Date().toISOString()
      ])
      .map((row) => ({ id: String(row.id), payload: JSON.parse(String(row.payload_json)) as AgentTaskResult }));
  }

  markRetry(id: string): void {
    const next = new Date(Date.now() + 30_000).toISOString();
    this.db.run("UPDATE pending_submissions SET submit_attempts = submit_attempts + 1, next_submit_after = ? WHERE id = ?", [
      next,
      id
    ]);
  }

  delete(id: string): void {
    this.db.run("DELETE FROM pending_submissions WHERE id = ?", [id]);
  }
}

type SqlStore = {
  exec(sql: string): void;
  run(sql: string, values: unknown[]): void;
  all(sql: string, values: unknown[]): Array<{ id: unknown; payload_json: unknown }>;
};

function createSqlStore(path: string): SqlStore {
  const require = createRequire(import.meta.url);
  try {
    const sqlite = require("node:sqlite") as { DatabaseSync: new (path: string) => any };
    const db = new sqlite.DatabaseSync(path);
    return {
      exec: (sql) => db.exec(sql),
      run: (sql, values) => db.prepare(sql).run(...values),
      all: (sql, values) => db.prepare(sql).all(...values)
    };
  } catch {
    return new SqliteCliStore(path);
  }
}

class SqliteCliStore implements SqlStore {
  constructor(private readonly path: string) {
    execFileSync("sqlite3", ["--version"], { stdio: "ignore" });
  }

  exec(sql: string): void {
    execFileSync("sqlite3", [this.path, sql]);
  }

  run(sql: string, values: unknown[]): void {
    this.exec(bindSql(sql, values));
  }

  all(sql: string, values: unknown[]): Array<{ id: unknown; payload_json: unknown }> {
    const output = execFileSync("sqlite3", ["-json", this.path, bindSql(sql, values)], { encoding: "utf8" });
    return output.trim() ? (JSON.parse(output) as Array<{ id: unknown; payload_json: unknown }>) : [];
  }
}

function bindSql(sql: string, values: unknown[]): string {
  let index = 0;
  return sql.replace(/\?/g, () => sqlLiteral(values[index++]));
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}
