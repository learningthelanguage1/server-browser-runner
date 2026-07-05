# Provider Home Login Health Handoff

Date: 2026-07-05

## Problem

After enabling Claude, live self-check reached `https://claude.ai/` with no
composer and reported selector breakage. In product terms, that means the
server browser profile is not logged in yet.

## What was implemented

- ChatGPT health treats a public home page with no composer as `LOGIN_REQUIRED`.
- Claude health treats a public home page with no composer as `LOGIN_REQUIRED`.
- Added a regression check for provider home pages without a composer.

## Final result

The runner now reports the next useful action for non-logged-in provider
profiles: log in through the server browser profile.

## What remains

- Install the shared runner secret on Brain and runner.
- Log into ChatGPT and Claude through the server browser profile.
- Queue and prove real provider tasks.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 16 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
