import type { ProviderAdapter } from "./ProviderAdapter.js";
import type { ProviderName, RunnerConfig } from "../types.js";
import { FakeEchoAdapter } from "./fakeEcho/FakeEchoAdapter.js";
import { InternalWebAdapter } from "./internalWeb/InternalWebAdapter.js";
import { ChatGptWebAdapter } from "./chatgpt/ChatGptWebAdapter.js";
import { ClaudeWebAdapter } from "./claude/ClaudeWebAdapter.js";

export function createAdapters(config: RunnerConfig): Record<ProviderName, ProviderAdapter> {
  return {
    fake_echo: new FakeEchoAdapter(config),
    internal: new InternalWebAdapter(config),
    chatgpt: new ChatGptWebAdapter(config),
    claude: new ClaudeWebAdapter(config)
  };
}
