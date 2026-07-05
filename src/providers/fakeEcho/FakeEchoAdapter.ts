import type { ProviderAdapter } from "../ProviderAdapter.js";
import type { AgentTask, AgentTaskResult, RunnerConfig } from "../../types.js";

export class FakeEchoAdapter implements ProviderAdapter {
  name = "fake_echo_adapter";
  provider = "fake_echo" as const;
  kind = "browser" as const;

  constructor(private readonly config: RunnerConfig) {}

  async selfCheck() {
    return { provider: this.provider, status: "ready" as const };
  }

  async execute(task: AgentTask): Promise<AgentTaskResult> {
    const now = new Date().toISOString();
    const marker = task.expected_output?.done_marker ?? `[[FF_DONE:${task.task_id}]]`;
    const mustInclude = Array.isArray(task.expected_output?.must_include)
      ? task.expected_output?.must_include[0]
      : task.expected_output?.must_include;
    const clean = mustInclude ?? task.prompt;
    return {
      task_id: task.task_id,
      runner_id: this.config.runner.id,
      attempt_id: `attempt_${Date.now()}`,
      status: "succeeded",
      result_text: `${clean}\n${marker}`,
      clean_result_text: clean,
      capture_method: "fake_echo",
      timings: {
        claimed_at: now,
        prompt_sent_at: now,
        response_completed_at: now
      },
      validation_status: "passed",
      provider_receipt: {
        provider: this.provider,
        adapter_version: "0.1.0"
      }
    };
  }
}
