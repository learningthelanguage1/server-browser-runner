# Human Check Failure Code Handoff

Date: 2026-07-05

## Problem

The provider health checks already looked for human-check or captcha screens,
but reported them as generic unknown or selector failures. That blurred an
operator-owned blocker with a code-maintenance problem.

## What was implemented

- Added `human_check_required` to provider health status.
- Mapped ChatGPT and Claude human-check selectors to that status.
- Converted that status to `CAPTCHA_OR_HUMAN_CHECK` during provider execution.
- Added a regression check covering both provider health helpers.

## Final result

If ChatGPT or Claude asks for a human verification step, the runner now reports
the explicit non-retryable blocker instead of hiding it behind a generic error.

## What remains

- Live ChatGPT proof still needs the approved shared runner secret and manual
  ChatGPT login on the Linux server profile.
- Claude remains disabled until approval exists.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 13 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
