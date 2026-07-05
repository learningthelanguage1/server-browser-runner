import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { runnerConfigSchema } from "./schema.js";
import type { RunnerConfig } from "../types.js";

export async function loadConfig(path = "config/runner.example.yaml"): Promise<RunnerConfig> {
  const raw = await readFile(path, "utf8");
  return runnerConfigSchema.parse(YAML.parse(raw));
}
