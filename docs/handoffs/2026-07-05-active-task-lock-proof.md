# Active task lock proof

## Problem

The implementation plan requires one active task at a time and no second claim
while a task is still running. The runtime lock existed, but there was no
regression proof covering that acceptance point.

## What was implemented

- Added a focused runner test that starts one long-running task and verifies a
  second `runOnce()` does not claim another task while the first is active.

## Final result

The one-active-task rule now has direct test coverage without changing runtime
behavior.

## What remains

- 2026-07-05: Live ChatGPT proof still needs the server runner secret and manual
  provider login over localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 8 tests.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
