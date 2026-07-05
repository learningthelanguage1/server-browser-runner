# Failure Log Artifacts Handoff

## Problem

Runner failures could submit an error code without any local diagnostic artifact.

## What was implemented

- Failed tasks now write a small JSON log artifact with task id, provider,
  target host, error code, and error message.
- The existing spool flush uploads that log metadata to Brain before submitting
  the failed result.
- Added a focused test for failed-domain rejection producing an uploaded log
  artifact.

## Final result

Every runner failure now has at least one diagnostic artifact, even when the
failure happens before a provider page can be opened.

## What remains

- Browser-page failures can still be improved with screenshots from inside the
  provider adapters.
- Live runner registration still waits on explicit shared-secret approval.
- ChatGPT live proof still waits on manual profile login over VNC.

## Verification

- `pnpm build` passed.
- `pnpm test` passed with 6 tests.

## Notion

Notion was not updated from this thread; the local handoff is the durable record
for this slice.
