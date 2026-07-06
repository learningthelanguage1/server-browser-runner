# Brain Claim Retry And ChatGPT Account

## Problem

The live runner crashed during a short Brain restart/proxy 502 window while it
was trying to claim the next task. A queued ChatGPT proof task also stayed
queued because Brain had no live `chatgpt_main` provider account row.

## Implemented

The runner now treats a temporary Brain claim failure as a poll miss and waits
for the next cycle instead of exiting. The live Brain DB now has the approved
`chatgpt_main` browser account with the OpenAI permission reference.

## Final result

The runner service is deployed at commit
`a1e05c114b427382cb8c3a33679979dd66c08ae2` and stays active. Brain released
task `task_chatgpt_login_required_20260706_133858`; the runner claimed it,
detected the missing ChatGPT login, and Brain moved it to
`blocked_for_operator` with `LOGIN_REQUIRED`.

## What remains

- 2026-07-06: Complete manual ChatGPT login in the VNC browser.
- 2026-07-06: Re-run the first ChatGPT success proof:
  `task_openai_permission_test_001`.

## Verification

- 2026-07-06: `corepack pnpm test` passed locally with 17 runner checks.
- 2026-07-06: Pushed to `learningthelanguage1/server-browser-runner`
  `development` at commit `a1e05c114b427382cb8c3a33679979dd66c08ae2`.
- 2026-07-06: Deployed to `/srv/ff-browser-runner/app`, built with
  `corepack pnpm build`, and restarted `ff-browser-runner`.
- 2026-07-06: Live Brain task readback showed
  `task_chatgpt_login_required_20260706_133858|blocked_for_operator|chatgpt|chatgpt_main`
  and attempt error `LOGIN_REQUIRED`.
- 2026-07-06: Runner local spool remained empty after the blocked task.

Notion was not updated from this thread.
