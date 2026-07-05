# Runner preflight

## Problem

Runner service startup blockers such as a missing secret or missing display were
only visible after starting a command that needed them.

## What was implemented

- Added a `preflight` CLI command.
- Added `pnpm preflight`.
- The command reports runner secret, display, spool, artifact directory, and
  provider gate status as JSON without starting the runner service.

## Final result

Operators can now see the remaining service blockers before enabling the main
runner.

## What remains

- 2026-07-05: The runner secret still needs to be configured before live Brain
  queue proof.
- 2026-07-05: Live ChatGPT proof still needs manual provider login over
  localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 9 tests.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
