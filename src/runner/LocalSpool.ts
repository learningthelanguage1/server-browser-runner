import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AgentTaskResult } from "../types.js";

export class LocalSpool {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
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
    this.db
      .prepare(
        `INSERT OR REPLACE INTO pending_submissions
        (id, task_id, attempt_id, payload_json, artifact_paths_json, next_submit_after, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        result.task_id,
        result.attempt_id,
        JSON.stringify(result),
        JSON.stringify(result.artifacts ?? []),
        new Date().toISOString(),
        new Date().toISOString()
      );
    return id;
  }

  due(): Array<{ id: string; payload: AgentTaskResult }> {
    return this.db
      .prepare("SELECT id, payload_json FROM pending_submissions WHERE next_submit_after <= ? ORDER BY created_at ASC")
      .all(new Date().toISOString())
      .map((row) => ({ id: String(row.id), payload: JSON.parse(String(row.payload_json)) as AgentTaskResult }));
  }

  markRetry(id: string): void {
    const next = new Date(Date.now() + 30_000).toISOString();
    this.db
      .prepare("UPDATE pending_submissions SET submit_attempts = submit_attempts + 1, next_submit_after = ? WHERE id = ?")
      .run(next, id);
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM pending_submissions WHERE id = ?").run(id);
  }
}
