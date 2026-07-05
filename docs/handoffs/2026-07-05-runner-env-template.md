# Runner Env Template Handoff

Date: 2026-07-05

## Problem

The server runner service expects `/srv/ff-browser-runner/config/runner.env`,
but the repo did not carry a safe committed template for operators to copy.
The real runner secret must not be generated, installed, or committed without
explicit approval.

## What was implemented

- Added `config/runner.env.example` as the safe committed template.
- Added `config/runner.env` to `.gitignore` so the real server secret file is
  not committed by accident.
- Updated deployment docs to copy the template, edit the real server env file,
  and run preflight with the same env file that systemd reads.

## Final result

Operators now have a safe path to create the runner env file after the shared
Brain and runner secret is approved.

## What remains

- Install the approved shared secret on Brain as `FUNFLUEN_AGENT_RUNNER_SECRET`.
- Install the same approved shared secret on the runner as `FF_RUNNER_SECRET`.
- Run server preflight after the secret is installed.
- Start the main runner service only after preflight passes.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 11 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
