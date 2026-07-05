# Provider self-check startup failures

## Problem

ChatGPT and Claude self-checks could crash the CLI if the browser failed before a
context was created, for example when `DISPLAY` was missing.

## What was implemented

- Updated ChatGPT self-check to return `unknown_error` health details on browser
  startup failures.
- Updated Claude self-check to return `unknown_error` health details on browser
  startup failures.

## Final result

Provider self-checks now report health instead of crashing when the browser
cannot start.

## What remains

- 2026-07-05: Live ChatGPT proof still needs manual provider login over
  localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.
- 2026-07-05: Full Brain queue submission still needs runner secret setup.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 8 tests.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
