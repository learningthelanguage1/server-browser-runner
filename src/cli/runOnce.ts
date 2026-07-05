import { BrainClient } from "../brain/BrainClient.js";
import { createAdapters } from "../providers/registry.js";
import { RunnerLoop } from "../runner/RunnerLoop.js";
import type { RunnerConfig } from "../types.js";

export async function runOnce(config: RunnerConfig) {
  const brain = new BrainClient(config);
  const loop = new RunnerLoop(config, brain, createAdapters(config));
  await loop.runOnce();
}
