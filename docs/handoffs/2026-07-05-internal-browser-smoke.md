# Internal browser smoke proof

## Problem

The internal browser self-check proved the owned page could load, but it did not
prove that the adapter could send a prompt, capture the answer, clean the marker,
and produce an artifact.

## What was implemented

- Added `scripts/smoke-internal-browser.mjs`.
- Added `pnpm smoke:internal` as the repeatable command.
- The smoke command executes the existing internal browser adapter directly
  against the configured owned test page.

## Final result

The internal browser adapter now has a repeatable proof command that does not
need provider credentials or Brain queue secrets.

## What remains

- 2026-07-05: Full Brain queue submission still needs runner secret setup.
- 2026-07-05: Live ChatGPT proof still needs manual provider login over
  localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 8 tests.
- First server smoke proved send/capture/screenshot but exposed the owned page
  returns `INTERNAL_BROWSER_RUNNER_OK`; the smoke expectation now matches that
  internal-page contract.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
