import { mkdtempSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FakeEchoAdapter } from "../dist/providers/fakeEcho/FakeEchoAdapter.js";
import { assertAllowedDomain } from "../dist/security/DomainAllowlist.js";
import { assertProviderPermission } from "../dist/security/PermissionGate.js";
import { LocalSpool } from "../dist/runner/LocalSpool.js";

describe("runner MVP guards", () => {
  it("fake echo returns expected output and marker", async () => {
    const config = testConfig();
    const result = await new FakeEchoAdapter(config).execute({
      task_id: "task_1",
      job_type: "llm_browser_prompt",
      provider: "fake_echo",
      adapter: "browser",
      target_url: "https://automation.funfluen.com/runner-test-chat",
      prompt: "Say only: OK",
      expected_output: {
        must_include: "ELAINE_PROMPT_CHAIN_OK",
        done_marker: "[[FF_DONE:task_1]]"
      }
    });
    assert.equal(result.status, "succeeded");
    assert.equal(result.clean_result_text, "ELAINE_PROMPT_CHAIN_OK");
    assert.match(result.result_text ?? "", /\[\[FF_DONE:task_1\]\]/);
  });

  it("rejects domains outside the task allowlist", () => {
    assert.throws(() => assertAllowedDomain("https://example.com", ["chatgpt.com"]), /DOMAIN_NOT_ALLOWED/);
  });

  it("blocks Claude when permission is not approved", () => {
    const config = testConfig();
    assert.throws(() => assertProviderPermission("claude", config.providers.claude), /PROVIDER_PERMISSION_BLOCKED/);
  });

  it("stores captured results in local spool until submission succeeds", () => {
    const dir = mkdtempSync(join(tmpdir(), "ff-runner-"));
    const spool = new LocalSpool(join(dir, "runner.sqlite"));
    const id = spool.save({
      task_id: "task_1",
      runner_id: "runner_1",
      attempt_id: "attempt_1",
      status: "succeeded",
      result_text: "OK"
    });
    assert.equal(spool.due().length, 1);
    spool.delete(id);
    assert.equal(spool.due().length, 0);
  });
});

function testConfig() {
  const dir = mkdtempSync(join(tmpdir(), "ff-runner-"));
  return {
    runner: {
      id: "runner_1",
      name: "test",
      poll_interval_seconds: 1,
      max_active_tasks: 1,
      lease_seconds: 900,
      local_spool_path: join(dir, "runner.sqlite")
    },
    brain: {
      base_url: "https://automation.funfluen.com",
      runner_secret_env: "FF_RUNNER_SECRET",
      timeout_seconds: 30
    },
    browser: {
      engine: "chromium",
      channel: "chrome",
      headless: true,
      viewport: { width: 1440, height: 1000 },
      locale: "en-US",
      timezone_id: "Asia/Tbilisi",
      artifacts_dir: join(dir, "artifacts"),
      traces_enabled: true,
      screenshot_on_failure: true,
      screenshot_on_success: true
    },
    providers: {
      fake_echo: provider(dir, true, false, "approved", "https://automation.funfluen.com/runner-test-chat", ["automation.funfluen.com"]),
      internal: provider(dir, true, false, "approved", "https://automation.funfluen.com/runner-test-chat", ["automation.funfluen.com"]),
      chatgpt: provider(dir, true, true, "approved", "https://chatgpt.com/", ["chatgpt.com", "chat.openai.com"]),
      claude: provider(dir, false, true, "not_approved", "https://claude.ai/", ["claude.ai"])
    }
  };
}

function provider(dir, enabled, permission_required, permission_status, target_url, allowed_domains) {
  return {
    enabled,
    permission_required,
    permission_status,
    permission_ref: permission_status === "approved" ? "test_permission" : null,
    adapter: "browser",
    target_url,
    allowed_domains,
    profile_dir: join(dir, "profile"),
    min_gap_seconds: 1,
    max_tasks_per_hour: 10,
    max_tasks_per_day: 20,
    timeout_seconds: 60
  };
}
