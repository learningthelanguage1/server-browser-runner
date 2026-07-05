import { access } from "node:fs/promises";
import { dirname } from "node:path";
import type { RunnerConfig } from "../types.js";

type CheckStatus = "pass" | "warn" | "fail";

export type PreflightCheck = {
  name: string;
  status: CheckStatus;
  details?: string;
};

export async function preflight(config: RunnerConfig, env: NodeJS.ProcessEnv = process.env) {
  const checks: PreflightCheck[] = [];
  const check = (name: string, status: CheckStatus, details?: string) => checks.push({ name, status, details });

  check(
    "runner_secret",
    env[config.brain.runner_secret_env] ? "pass" : "fail",
    env[config.brain.runner_secret_env] ? undefined : `Missing ${config.brain.runner_secret_env}`
  );
  check("display", config.browser.headless || env.DISPLAY ? "pass" : "fail", config.browser.headless ? "headless" : env.DISPLAY ?? "Missing DISPLAY");
  check("spool_parent", (await exists(dirname(config.runner.local_spool_path))) ? "pass" : "fail", dirname(config.runner.local_spool_path));
  check("artifacts_dir", (await exists(config.browser.artifacts_dir)) ? "pass" : "fail", config.browser.artifacts_dir);

  for (const [provider, providerConfig] of Object.entries(config.providers)) {
    if (!providerConfig.enabled) {
      check(`provider:${provider}`, "warn", "disabled");
    } else if (providerConfig.permission_required && providerConfig.permission_status !== "approved") {
      check(`provider:${provider}`, "fail", "permission not approved");
    } else {
      check(`provider:${provider}`, "pass", providerConfig.permission_ref ?? "no permission required");
    }
  }

  return { ok: checks.every((item) => item.status !== "fail"), checks };
}

async function exists(path: string) {
  return access(path).then(
    () => true,
    () => false
  );
}
