# Preflight env file

## Problem

The runner service reads `/srv/ff-browser-runner/config/runner.env`, but the
preflight command only checked the current shell environment.

## What was implemented

- Added `--env-file` support to `preflight`.
- Added a small env-file parser for `KEY=value` service env files.
- Added a regression test for env-file parsing.

## Final result

Preflight can now inspect the same environment file systemd uses without
starting the main runner service.

## What remains

- 2026-07-05: `/srv/ff-browser-runner/config/runner.env` still needs to be
  created with `FF_RUNNER_SECRET`.
- 2026-07-05: Brain must use the matching runner secret before live queue proof.
- 2026-07-05: ChatGPT still needs manual login over localhost-only VNC.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 11 tests.
- First server `--env-file` run exposed missing env-file handling; preflight now
  reports a JSON `env_file` failure instead of crashing when the file is absent.
- Missing env-file reports now include the rest of preflight checks, so operators
  still see display, storage, and provider readiness in one response.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
