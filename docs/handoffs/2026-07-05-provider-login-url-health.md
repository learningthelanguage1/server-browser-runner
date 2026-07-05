# Provider Login URL Health Handoff

Date: 2026-07-05

## Problem

After Claude approval was enabled, the live Claude self-check reached the Claude
login page but reported `selector_broken`. Product-wise, that is not a broken
flow; it means the server browser profile needs manual login.

## What was implemented

- ChatGPT health now treats login URLs as `login_required`.
- Claude health now treats login URLs as `login_required`.
- Added a regression check for login-page health.

## Final result

The runner now tells the operator the correct next action when a provider opens
to a login page.

## What remains

- Install the shared runner secret on Brain and runner.
- Log into ChatGPT and Claude through the server browser profile.
- Queue and prove real provider tasks.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 15 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
