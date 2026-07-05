import { loadConfig } from "../dist/config/loadConfig.js";
import { InternalWebAdapter } from "../dist/providers/internalWeb/InternalWebAdapter.js";

const configPath = valueAfter("--config") ?? "config/runner.example.yaml";
const config = await loadConfig(configPath);
const taskId = `internal_smoke_${Date.now()}`;
const marker = `[[FF_DONE:${taskId}]]`;

const result = await new InternalWebAdapter(config).execute({
  task_id: taskId,
  job_type: "llm_browser_prompt",
  provider: "internal",
  adapter: "browser",
  target_url: config.providers.internal.target_url,
  prompt: `Say only: ELAINE_PROMPT_CHAIN_OK\n\nAt the end, print:\n${marker}`,
  expected_output: {
    must_include: "ELAINE_PROMPT_CHAIN_OK",
    done_marker: marker
  },
  timeout_seconds: 60,
  allowed_domains: config.providers.internal.allowed_domains
});

console.log(
  JSON.stringify(
    {
      task_id: result.task_id,
      status: result.status,
      clean_result_text: result.clean_result_text,
      capture_method: result.capture_method,
      validation_status: result.validation_status,
      error_code: result.error_code,
      artifact_types: (result.artifacts ?? []).map((artifact) => artifact.type)
    },
    null,
    2
  )
);

if (result.status !== "succeeded" || result.clean_result_text !== "ELAINE_PROMPT_CHAIN_OK") {
  process.exitCode = 1;
}

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}
