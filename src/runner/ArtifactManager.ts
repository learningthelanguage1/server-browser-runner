import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ArtifactRef, RunnerConfig } from "../types.js";

export class ArtifactManager {
  constructor(private readonly config: RunnerConfig) {}

  async writeLog(taskId: string, text: string): Promise<ArtifactRef> {
    const dir = join(this.config.browser.artifacts_dir, "logs");
    await mkdir(dir, { recursive: true });
    const path = join(dir, `${taskId}-${Date.now()}.log`);
    await writeFile(path, text, "utf8");
    return { type: "log", path };
  }
}
