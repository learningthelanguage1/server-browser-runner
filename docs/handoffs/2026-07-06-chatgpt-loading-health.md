# ChatGPT Loading Health

## Problem

Live article-chain retries reached ChatGPT, but the failure screenshots showed a
blank ChatGPT loading screen while Brain recorded `LOGIN_REQUIRED`. That paused
the article chains for operator action even though there was no visible logout
screen.

## What Was Implemented

- ChatGPT health now reports the blank root page without a composer as
  `loading`.
- ChatGPT execution and self-check wait briefly for `loading` to resolve before
  deciding whether the provider is ready, rate-limited, blocked by human check,
  or truly logged out.
- Timeout classification keeps `loading` retryable as `RESPONSE_TIMEOUT`.
- Login URL/text still returns `LOGIN_REQUIRED`.

## Final Result

The runner no longer turns slow ChatGPT startup into a permanent operator block.
Real login, rate-limit, and human-check states keep their existing behavior.

## What Remains

- 2026-07-06: Re-run the live article chain after deploying this runner patch
  and confirm the next prompt either succeeds or records a retryable provider
  wait instead of `LOGIN_REQUIRED`.

## Verification

- `corepack pnpm test`
