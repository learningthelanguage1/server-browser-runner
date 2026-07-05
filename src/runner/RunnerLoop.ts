import type { BrainClient } from "../brain/BrainClient.js";
import type { ProviderAdapter } from "../providers/ProviderAdapter.js";
import type { AgentTask, AgentTaskResult, FailureCode, ProviderName, RunnerConfig } from "../types.js";
import { assertAllowedDomain } from "../security/DomainAllowlist.js";
import { assertProviderPermission } from "../security/PermissionGate.js";
import { LocalSpool } from "./LocalSpool.js";
import { RateLimitGate } from "./RateLimitGate.js";
import { TaskLock } from "./TaskLock.js";

export class RunnerLoop {
  private readonly lock = new TaskLock();
  private readonly rateGate = new RateLimitGate();
  private readonly spool: LocalSpool;

  constructor(
    private readonly config: RunnerConfig,
    private readonly brain: BrainClient,
    private readonly adapters: Record<ProviderName, ProviderAdapter>
  ) {
    this.spool = new LocalSpool(config.runner.local_spool_path);
  }

  async start(): Promise<void> {
    await this.brain.registerRunner({ providers: Object.keys(this.config.providers), version: "0.1.0" });
    setInterval(() => void this.brain.heartbeatRunner(this.lock.current() ?? undefined).catch(() => undefined), 30_000);
    while (true) {
      await this.runOnce();
      await sleep(this.config.runner.poll_interval_seconds * 1000);
    }
  }

  async runOnce(): Promise<void> {
    await this.flushSpool();
    if (this.lock.current()) return;
    const task = await this.brain.claimNextTask();
    if (!task) return;
    await this.executeClaimedTask(task);
  }

  async flushSpool(): Promise<void> {
    for (const row of this.spool.due()) {
      try {
        if (row.payload.status === "failed") await this.brain.failTask(row.payload);
        else await this.brain.submitTaskResult(row.payload);
        this.spool.delete(row.id);
      } catch {
        this.spool.markRetry(row.id);
      }
    }
  }

  private async executeClaimedTask(task: AgentTask): Promise<void> {
    if (!this.lock.acquire(task.task_id)) return;
    try {
      const result = await this.executeTask(task);
      this.spool.save(result);
      await this.flushSpool();
    } finally {
      this.lock.release(task.task_id);
    }
  }

  private async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    try {
      const providerConfig = this.config.providers[task.provider];
      assertProviderPermission(task.provider, providerConfig);
      assertAllowedDomain(task.target_url, task.allowed_domains?.length ? task.allowed_domains : providerConfig.allowed_domains);
      this.rateGate.assertCanRun(task.provider, providerConfig);
      const result = await this.adapters[task.provider].execute(task);
      this.rateGate.record(task.provider);
      return result;
    } catch (error) {
      return failedResult(this.config.runner.id, task, error);
    }
  }
}

function failedResult(runnerId: string, task: AgentTask, error: unknown): AgentTaskResult {
  const message = error instanceof Error ? error.message : String(error);
  const [maybeCode] = message.split(":");
  const code = errorCodes.has(maybeCode as FailureCode) ? (maybeCode as FailureCode) : "UNKNOWN_PROVIDER_ERROR";
  return {
    task_id: task.task_id,
    runner_id: runnerId,
    attempt_id: `attempt_${Date.now()}`,
    status: "failed",
    error_code: code,
    error_message: message,
    retryable: ["PROVIDER_RATE_LIMITED", "PROVIDER_COOLDOWN", "RESPONSE_TIMEOUT", "BRAIN_SUBMIT_FAILED"].includes(code)
  };
}

const errorCodes = new Set<FailureCode>([
  "LOGIN_REQUIRED",
  "PROVIDER_PERMISSION_BLOCKED",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_COOLDOWN",
  "CAPTCHA_OR_HUMAN_CHECK",
  "DOMAIN_NOT_ALLOWED",
  "SELECTOR_CHANGED",
  "COMPOSER_NOT_FOUND",
  "SEND_FAILED",
  "RESPONSE_TIMEOUT",
  "RESPONSE_EMPTY",
  "DONE_MARKER_MISSING",
  "CAPTURE_FAILED",
  "BRAIN_SUBMIT_FAILED",
  "LOCAL_SPOOL_WRITE_FAILED",
  "UNKNOWN_PROVIDER_ERROR"
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
