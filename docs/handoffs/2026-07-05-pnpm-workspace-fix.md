# Pnpm Workspace Fix Handoff

## Problem

The OS-server rebuild hit `packages field missing or empty` because
`pnpm-workspace.yaml` had build-approval metadata but no package list.

## What was implemented

- Added the root package entry to `pnpm-workspace.yaml`.
- Recorded the server rebuild issue in the cumulative open-items doc.

## Final result

The runner checkout now carries valid pnpm workspace metadata instead of relying
on a server-only workaround.

## What remains

- Re-run the server rebuild after this fix is committed and pushed.
- The shared runner secret is still intentionally not installed.

## Verification

Pending local build and test after this handoff was written.

## Notion

Notion was not updated from this thread; the local handoff is the durable record
for this slice.
