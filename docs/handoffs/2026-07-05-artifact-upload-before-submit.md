# Artifact Upload Before Submit Handoff

## Problem

The runner could create local screenshots/logs and Brain exposed an artifact
upload endpoint, but the runner did not call it before submitting task results.

## What was implemented

- Spool flushing now uploads artifact metadata for local artifact paths.
- Submitted results now include the returned Brain `artifact_id`.
- Already-uploaded artifacts are skipped on retry.
- A focused runner test proves upload happens before result submission.

## Final result

Brain can connect task results to screenshot/log artifact records instead of
receiving only local runner file paths.

## What remains

- The shared runner secret still needs explicit approval before live Brain
  registration and artifact upload can run from the OS-server service.

## Verification

- `pnpm build` passed.
- `pnpm test` passed with 5 tests.

## Notion

Notion was not updated from this thread; the local handoff is the durable record
for this slice.
