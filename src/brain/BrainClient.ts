import { createHmac } from "node:crypto";
import type { AgentTask, AgentTaskResult, RunnerConfig } from "../types.js";

export class BrainClient {
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly runnerId: string;
  private readonly timeoutMs: number;

  constructor(config: RunnerConfig, secret = process.env[config.brain.runner_secret_env] ?? "") {
    if (!secret) {
      throw new Error(`Missing runner secret env ${config.brain.runner_secret_env}`);
    }
    this.baseUrl = config.brain.base_url.replace(/\/$/, "");
    this.secret = secret;
    this.runnerId = config.runner.id;
    this.timeoutMs = config.brain.timeout_seconds * 1000;
  }

  registerRunner(capabilities: Record<string, unknown>) {
    return this.post("/internal/agent-runners/register", {
      runner_id: this.runnerId,
      capabilities
    });
  }

  heartbeatRunner(activeTaskId?: string) {
    return this.post("/internal/agent-runners/heartbeat", {
      runner_id: this.runnerId,
      active_task_id: activeTaskId
    });
  }

  async claimNextTask(): Promise<AgentTask | null> {
    const response = await this.post("/internal/agent-runners/claim-next-task", {
      runner_id: this.runnerId
    });
    return (response.task ?? null) as AgentTask | null;
  }

  submitTaskResult(result: AgentTaskResult) {
    return this.post("/internal/agent-runners/submit-result", result);
  }

  failTask(result: AgentTaskResult) {
    return this.post("/internal/agent-runners/fail-task", result);
  }

  uploadArtifact(payload: Record<string, unknown>) {
    return this.post("/internal/agent-runners/upload-artifact", payload);
  }

  private async post(path: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const body = JSON.stringify(payload);
    const timestamp = new Date().toISOString();
    const signature = createHmac("sha256", this.secret).update(`${timestamp}.${body}`).digest("hex");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-runner-id": this.runnerId,
          "x-runner-timestamp": timestamp,
          "x-runner-signature": signature
        },
        body,
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Brain ${path} failed: ${response.status} ${await response.text()}`);
      }
      return (await response.json()) as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
    }
  }
}
