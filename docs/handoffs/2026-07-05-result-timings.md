# Result Timings Handoff

Date: 2026-07-05

## Problem

The runner result contract includes timing fields, but successful task results
did not carry adapter execution timing or a runner-side submit timestamp.

## What was implemented

- Added basic adapter timings to fake, internal, ChatGPT, and Claude results.
- Added `submitted_at` in the runner submit path immediately before Brain
  submit/fail calls.
- Added regression coverage for fake adapter timings and submit timing.

## Final result

Brain receives more useful task receipts without adding a separate timing
system or changing the provider workflow.

## What remains

- Live ChatGPT proof still needs the approved shared runner secret and manual
  ChatGPT login on the Linux server profile.
- Claude remains disabled until approval exists.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 14 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
