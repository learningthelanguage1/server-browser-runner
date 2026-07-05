# Empty Answer Capture Handoff

Date: 2026-07-05

## Problem

Provider adapters used the shared capture helper, but an empty copy/DOM capture
could still return as a successful answer. That could make Brain receive a
false successful result with no usable provider output.

## What was implemented

- Changed the shared capture helper to throw `RESPONSE_EMPTY` when copy and DOM
  capture both produce no text.
- Added a small regression check so empty capture fails instead of reporting
  success.

## Final result

Internal, ChatGPT, and Claude browser adapters now share the same empty-answer
failure behavior through the common capture helper.

## What remains

- Live ChatGPT proof still needs the approved shared runner secret and manual
  ChatGPT login on the Linux server profile.
- Claude remains disabled until approval exists.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 12 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
