import { loadConfig } from "./config/loadConfig.js";
import { BrainClient } from "./brain/BrainClient.js";
import { createAdapters } from "./providers/registry.js";
import { RunnerLoop } from "./runner/RunnerLoop.js";
import { loginProvider } from "./cli/loginProvider.js";
import { selfCheck } from "./cli/selfCheck.js";
import { runOnce } from "./cli/runOnce.js";
import { envFromFile, preflight } from "./cli/preflight.js";
import type { ProviderName } from "./types.js";

const args = process.argv.slice(2);
const configPath = valueAfter("--config") ?? "config/runner.example.yaml";
const config = await loadConfig(configPath);

if (args[0] === "login") {
  await loginProvider(config, providerArg());
} else if (args[0] === "self-check") {
  console.log(JSON.stringify(await selfCheck(config, providerArg()), null, 2));
} else if (args[0] === "run-once") {
  await runOnce(config);
} else if (args[0] === "preflight") {
  const envFile = valueAfter("--env-file");
  const result = await preflight(config, envFile ? await envFromFile(envFile) : process.env);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} else {
  const brain = new BrainClient(config);
  await new RunnerLoop(config, brain, createAdapters(config)).start();
}

function providerArg(): ProviderName {
  const provider = valueAfter("--provider");
  if (provider === "chatgpt" || provider === "claude" || provider === "internal" || provider === "fake_echo") return provider;
  throw new Error("Use --provider chatgpt|claude|internal|fake_echo");
}

function valueAfter(name: string) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}
