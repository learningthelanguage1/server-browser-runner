# Browser failure screenshots

## Problem

Browser adapter failures produced runner failure logs, but provider-page screenshots
could be lost because the page closed before the runner-level failure handler ran.

## What was implemented

- Added one shared browser failure result helper.
- Updated internal web, ChatGPT, and Claude browser adapters to capture a
  screenshot before closing the provider page when execution fails.
- Added a focused runner test proving failed browser results keep screenshot
  artifacts.

## Final result

Provider-page failures now preserve the screenshot artifact in the failed task
payload so Brain can retain better proof for login, selector, rate-limit, and
timeout blockers.

## What remains

- 2026-07-05: Live ChatGPT proof still needs the server runner secret and manual
  provider login over localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.

## Verification

- `pnpm build` passed.
- `pnpm test` passed with 7 tests.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
