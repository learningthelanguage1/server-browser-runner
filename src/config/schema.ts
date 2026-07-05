import { z } from "zod";

const providerSchema = z.object({
  enabled: z.boolean(),
  permission_required: z.boolean(),
  permission_status: z.enum(["approved", "not_approved"]),
  permission_ref: z.string().nullable(),
  adapter: z.literal("browser"),
  target_url: z.string().url(),
  allowed_domains: z.array(z.string().min(1)).min(1),
  profile_dir: z.string().min(1),
  min_gap_seconds: z.number().int().nonnegative(),
  max_tasks_per_hour: z.number().int().positive(),
  max_tasks_per_day: z.number().int().positive(),
  timeout_seconds: z.number().int().positive()
});

export const runnerConfigSchema = z.object({
  runner: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    poll_interval_seconds: z.number().int().positive(),
    max_active_tasks: z.literal(1),
    lease_seconds: z.number().int().positive(),
    local_spool_path: z.string().min(1)
  }),
  brain: z.object({
    base_url: z.string().url(),
    runner_secret_env: z.string().min(1),
    timeout_seconds: z.number().int().positive()
  }),
  browser: z.object({
    engine: z.literal("chromium"),
    channel: z.string().optional(),
    headless: z.boolean(),
    viewport: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive()
    }),
    locale: z.string().min(1),
    timezone_id: z.string().min(1),
    artifacts_dir: z.string().min(1),
    traces_enabled: z.boolean(),
    screenshot_on_failure: z.boolean(),
    screenshot_on_success: z.boolean()
  }),
  providers: z.object({
    fake_echo: providerSchema,
    internal: providerSchema,
    chatgpt: providerSchema,
    claude: providerSchema
  })
});
