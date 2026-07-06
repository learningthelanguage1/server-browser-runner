import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FakeEchoAdapter } from "../dist/providers/fakeEcho/FakeEchoAdapter.js";
import { assertAllowedDomain } from "../dist/security/DomainAllowlist.js";
import { assertProviderPermission } from "../dist/security/PermissionGate.js";
import { LocalSpool } from "../dist/runner/LocalSpool.js";
import { RunnerLoop } from "../dist/runner/RunnerLoop.js";
import { browserFailedResult } from "../dist/providers/browserFailureResult.js";
import { captureLastAnswer } from "../dist/browser/CaptureEngine.js";
import { chatgptHealth } from "../dist/providers/chatgpt/chatgptHealth.js";
import { claudeHealth } from "../dist/providers/claude/claudeHealth.js";
import { envFromFile, preflight, preflightWithEnvFile } from "../dist/cli/preflight.js";

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
    assert.ok(result.timings.claimed_at);
    assert.ok(result.timings.prompt_sent_at);
    assert.ok(result.timings.response_completed_at);
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

  it("uploads local artifact metadata before submitting a spooled result", async () => {
    const config = testConfig();
    const screenshot = join(config.browser.artifacts_dir, "final.png");
    mkdirSync(config.browser.artifacts_dir, { recursive: true });
    writeFileSync(screenshot, "png");
    new LocalSpool(config.runner.local_spool_path).save({
      task_id: "task_1",
      runner_id: "runner_1",
      attempt_id: "attempt_1",
      status: "succeeded",
      result_text: "OK",
      artifacts: [{ type: "screenshot", path: screenshot }]
    });
    const brain = {
      uploadArtifact: async (payload) => {
        assert.equal(payload.artifact_type, "screenshot");
        assert.equal(payload.size_bytes, 3);
        return { artifact: { artifact_id: "artifact_1" } };
      },
      submitTaskResult: async (payload) => {
        assert.equal(payload.artifacts[0].artifact_id, "artifact_1");
        assert.ok(payload.timings.submitted_at);
        return {};
      },
      failTask: async () => ({})
    };

    await new RunnerLoop(config, brain, {}).flushSpool();

    assert.equal(new LocalSpool(config.runner.local_spool_path).due().length, 0);
  });

  it("writes and uploads a failure log artifact", async () => {
    const config = testConfig();
    const brain = {
      claimNextTask: async () => ({
        task_id: "task_bad_domain",
        job_type: "llm_browser_prompt",
        provider: "chatgpt",
        adapter: "browser",
        target_url: "https://example.com/",
        prompt: "Say only OK",
        allowed_domains: ["chatgpt.com"]
      }),
      uploadArtifact: async (payload) => {
        assert.equal(payload.artifact_type, "log");
        assert.equal(payload.task_id, "task_bad_domain");
        assert.ok(payload.size_bytes > 0);
        return { artifact: { artifact_id: "artifact_log_1" } };
      },
      failTask: async (payload) => {
        assert.equal(payload.error_code, "DOMAIN_NOT_ALLOWED");
        assert.equal(payload.artifacts[0].artifact_id, "artifact_log_1");
        return {};
      },
      submitTaskResult: async () => ({})
    };

    await new RunnerLoop(config, brain, {}).runOnce();

    assert.equal(new LocalSpool(config.runner.local_spool_path).due().length, 0);
  });

  it("keeps running when Brain task claim is temporarily unavailable", async () => {
    const config = testConfig();
    let claimed = false;
    const brain = {
      claimNextTask: async () => {
        claimed = true;
        throw new Error("Brain /claim-next-task failed: 502");
      }
    };

    await new RunnerLoop(config, brain, {}).runOnce();

    assert.equal(claimed, true);
  });

  it("keeps browser failure screenshot artifacts", () => {
    const result = browserFailedResult(
      "runner_1",
      {
        task_id: "task_login",
        job_type: "llm_browser_prompt",
        provider: "chatgpt",
        adapter: "browser",
        target_url: "https://chatgpt.com/",
        prompt: "Say only OK"
      },
      "chatgpt",
      "https://chatgpt.com/",
      new Error("LOGIN_REQUIRED"),
      [{ type: "screenshot", path: "/tmp/failure.png" }]
    );

    assert.equal(result.status, "failed");
    assert.equal(result.error_code, "LOGIN_REQUIRED");
    assert.equal(result.retryable, false);
    assert.equal(result.provider_receipt.url_host, "chatgpt.com");
    assert.equal(result.artifacts[0].type, "screenshot");
  });

  it("fails empty answer capture instead of reporting success", async () => {
    const page = {
      locator: () => ({
        last: () => ({
          count: async () => 0
        })
      })
    };
    const answer = {
      textContent: async () => ""
    };

    await assert.rejects(() => captureLastAnswer(page, answer), /RESPONSE_EMPTY/);
  });

  it("reports provider human checks explicitly", async () => {
    const page = {
      url: () => "https://claude.ai/chats",
      locator: (selector) => ({
        count: async () => (selector.includes("captcha") || selector.includes("human") ? 1 : 0)
      })
    };

    assert.equal(await chatgptHealth(page), "human_check_required");
    assert.equal(await claudeHealth(page), "human_check_required");
  });

  it("treats ChatGPT as ready when the composer is available", async () => {
    const page = {
      url: () => "https://claude.ai/chats",
      locator: (selector) => ({
        count: async () => (selector.includes("textarea") || selector.includes("contenteditable") ? 1 : 0)
      })
    };

    assert.equal(await chatgptHealth(page), "ready");
    assert.equal(await claudeHealth(page), "ready");
  });

  it("reports login pages as login required", async () => {
    const page = {
      url: () => "https://claude.ai/login",
      locator: () => ({ count: async () => 0 })
    };

    assert.equal(await chatgptHealth(page), "login_required");
    assert.equal(await claudeHealth(page), "login_required");
  });

  it("reports public provider home pages without composer as login required", async () => {
    const page = {
      url: () => "https://claude.ai/",
      locator: () => ({ count: async () => 0 })
    };

    assert.equal(await chatgptHealth(page), "login_required");
    assert.equal(await claudeHealth(page), "login_required");
  });

  it("does not claim a second task while one is active", async () => {
    const config = testConfig();
    let claimCount = 0;
    let finishTask;
    const brain = {
      claimNextTask: async () => {
        claimCount += 1;
        return {
          task_id: `task_${claimCount}`,
          job_type: "llm_browser_prompt",
          provider: "fake_echo",
          adapter: "browser",
          target_url: "https://automation.funfluen.com/runner-test-chat",
          prompt: "Say only OK"
        };
      },
      uploadArtifact: async () => ({}),
      submitTaskResult: async () => ({}),
      failTask: async () => ({})
    };
    const adapters = {
      fake_echo: {
        execute: async (task) => {
          await new Promise((resolve) => {
            finishTask = resolve;
          });
          return {
            task_id: task.task_id,
            runner_id: config.runner.id,
            attempt_id: "attempt_1",
            status: "succeeded",
            result_text: "OK"
          };
        }
      }
    };

    const loop = new RunnerLoop(config, brain, adapters);
    const firstRun = loop.runOnce();
    await new Promise((resolve) => setImmediate(resolve));
    await loop.runOnce();
    finishTask();
    await firstRun;

    assert.equal(claimCount, 1);
  });

  it("reports missing service preflight blockers", async () => {
    const config = testConfig();
    config.browser.headless = false;
    const result = await preflight(config, {});
    assert.equal(result.ok, false);
    assert.equal(result.checks.find((check) => check.name === "runner_secret").status, "fail");
    assert.equal(result.checks.find((check) => check.name === "display").status, "fail");
  });

  it("can read service preflight env files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ff-runner-"));
    const envPath = join(dir, "runner.env");
    writeFileSync(envPath, "FF_RUNNER_SECRET=test-secret\nDISPLAY=:99\n");
    const env = await envFromFile(envPath, {});
    assert.equal(env.FF_RUNNER_SECRET, "test-secret");
    assert.equal(env.DISPLAY, ":99");
  });

  it("reports missing preflight env files", async () => {
    const result = await preflightWithEnvFile(testConfig(), join(tmpdir(), "missing-runner.env"));
    assert.equal(result.ok, false);
    assert.equal(result.checks[0].name, "env_file");
    assert.equal(result.checks[0].status, "fail");
    assert.ok(result.checks.find((check) => check.name === "runner_secret"));
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
