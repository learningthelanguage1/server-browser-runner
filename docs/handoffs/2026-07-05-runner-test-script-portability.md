# Runner test script portability

## Problem

The server runner checkout could build through Corepack, but `pnpm test` failed
because the test script invoked `pnpm build` from inside the lifecycle script
and the runner service user did not have a global `pnpm` shim on `PATH`.

## What was implemented

- Changed the test script to call `tsc` directly before the Node test runner.
- Ignored npm-generated `package-lock.json` files so accidental npm lockfiles do
  not appear as runner repo changes.

## Final result

The test command no longer depends on nested package-manager lookup. The runner
repo remains pnpm-managed through `packageManager`.

## What remains

- 2026-07-05: Live ChatGPT proof still needs the server runner secret and manual
  provider login over localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 7 tests.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
