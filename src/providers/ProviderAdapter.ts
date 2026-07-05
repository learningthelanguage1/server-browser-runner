import type { AgentTask, AgentTaskResult, ProviderHealth } from "../types.js";

export interface ProviderAdapter {
  name: string;
  provider: "chatgpt" | "claude" | "internal" | "fake_echo";
  kind: "browser";
  selfCheck(): Promise<ProviderHealth>;
  execute(task: AgentTask): Promise<AgentTaskResult>;
}
