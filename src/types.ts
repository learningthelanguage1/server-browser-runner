export type ProviderName = "chatgpt" | "claude" | "internal" | "fake_echo";

export type FailureCode =
  | "LOGIN_REQUIRED"
  | "PROVIDER_PERMISSION_BLOCKED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_COOLDOWN"
  | "CAPTCHA_OR_HUMAN_CHECK"
  | "DOMAIN_NOT_ALLOWED"
  | "SELECTOR_CHANGED"
  | "COMPOSER_NOT_FOUND"
  | "SEND_FAILED"
  | "RESPONSE_TIMEOUT"
  | "RESPONSE_EMPTY"
  | "DONE_MARKER_MISSING"
  | "CAPTURE_FAILED"
  | "BRAIN_SUBMIT_FAILED"
  | "LOCAL_SPOOL_WRITE_FAILED"
  | "UNKNOWN_PROVIDER_ERROR";

export type ProviderHealth = {
  provider: string;
  status:
    | "ready"
    | "login_required"
    | "rate_limited"
    | "human_check_required"
    | "permission_blocked"
    | "selector_broken"
    | "unknown_error";
  accountLabel?: string;
  currentUrl?: string;
  cooldownUntil?: string;
  details?: string;
};

export type AgentTask = {
  task_id: string;
  chain_id?: string;
  step_id?: string;
  job_type: "llm_browser_prompt";
  provider: ProviderName;
  provider_account_id?: string;
  adapter: "browser";
  target_url: string;
  prompt: string;
  expected_output?: {
    format?: string;
    must_include?: string | string[];
    done_marker?: string;
    min_chars?: number;
    max_chars?: number;
  };
  timeout_seconds?: number;
  max_attempts?: number;
  priority?: number;
  allowed_domains?: string[];
  metadata?: Record<string, unknown>;
};

export type ArtifactRef = {
  type: "screenshot" | "trace" | "html_excerpt" | "log";
  artifact_id?: string;
  path?: string;
};

export type AgentTaskResult = {
  task_id: string;
  runner_id: string;
  attempt_id: string;
  status: "succeeded" | "failed";
  result_text?: string;
  clean_result_text?: string;
  capture_method?: "copy_button" | "dom" | "accessibility" | "fake_echo";
  timings?: Record<string, string>;
  provider_receipt?: Record<string, unknown>;
  artifacts?: ArtifactRef[];
  error_code?: FailureCode;
  error_message?: string;
  retryable?: boolean;
  validation_status?: "passed" | "marker_missing" | "failed";
  validation_errors?: string[];
};

export type ProviderConfig = {
  enabled: boolean;
  permission_required: boolean;
  permission_status: "approved" | "not_approved";
  permission_ref: string | null;
  adapter: "browser";
  target_url: string;
  allowed_domains: string[];
  profile_dir: string;
  min_gap_seconds: number;
  max_tasks_per_hour: number;
  max_tasks_per_day: number;
  timeout_seconds: number;
};

export type RunnerConfig = {
  runner: {
    id: string;
    name: string;
    poll_interval_seconds: number;
    max_active_tasks: number;
    lease_seconds: number;
    local_spool_path: string;
  };
  brain: {
    base_url: string;
    runner_secret_env: string;
    timeout_seconds: number;
  };
  browser: {
    engine: "chromium";
    channel?: string;
    headless: boolean;
    viewport: { width: number; height: number };
    locale: string;
    timezone_id: string;
    artifacts_dir: string;
    traces_enabled: boolean;
    screenshot_on_failure: boolean;
    screenshot_on_success: boolean;
  };
  providers: Record<ProviderName, ProviderConfig>;
};
