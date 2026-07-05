import type { AgentTask, AgentTaskResult, ArtifactRef, FailureCode, ProviderName } from "../types.js";

const failureCodes = new Set<FailureCode>([
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

const retryableCodes = new Set<FailureCode>([
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_COOLDOWN",
  "RESPONSE_TIMEOUT",
  "BRAIN_SUBMIT_FAILED"
]);

export function browserFailedResult(
  runnerId: string,
  task: AgentTask,
  provider: ProviderName,
  currentUrl: string,
  error: unknown,
  artifacts: ArtifactRef[]
): AgentTaskResult {
  const message = error instanceof Error ? error.message : String(error);
  const errorCode = failureCodes.has(message as FailureCode) ? (message as FailureCode) : "UNKNOWN_PROVIDER_ERROR";
  return {
    task_id: task.task_id,
    runner_id: runnerId,
    attempt_id: `attempt_${Date.now()}`,
    status: "failed",
    error_code: errorCode,
    error_message: message,
    retryable: retryableCodes.has(errorCode),
    validation_status: "failed",
    provider_receipt: {
      provider,
      adapter_version: "0.1.0",
      url_host: safeHost(currentUrl)
    },
    artifacts
  };
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
