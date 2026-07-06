# ChatGPT Timeout Rate Limit Classification

Date: 2026-07-06

## Problem

Live article-chain proof showed ChatGPT's `Too many requests` modal during the
answer wait, but the runner reported `RESPONSE_TIMEOUT`. Brain then treated the
task as a generic timeout instead of provider cooldown.

## What Was Implemented

- After a ChatGPT answer wait times out, the runner checks ChatGPT page health.
- Rate-limited timeout screens now report `PROVIDER_COOLDOWN`.
- Human-check and login screens also keep their explicit blocker codes.

## Final Result

Brain can pace the existing server runner correctly when ChatGPT rate-limits
after a prompt is sent.

## What Remains

- [2026-07-06 active] Continue the live Portuguese article chain after the
  current provider cooldown window.

## Verification

- `corepack pnpm test` returned 20 passing tests.
