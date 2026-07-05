# Provider Send Readiness Handoff

Date: 2026-07-05

## Problem

ChatGPT and Claude health checks could report ready when the composer existed
but the send control was missing. That could let the runner enter execution and
fail later with a weaker signal.

## What was implemented

- Updated ChatGPT health to require the send button selector.
- Updated Claude health to require the send button selector.
- Added a regression check that input without send control is not ready.

## Final result

Provider self-check now matches the runner plan more closely: ready means the
page has both a prompt input and a send control.

## What remains

- Live ChatGPT proof still needs the approved shared runner secret and manual
  ChatGPT login on the Linux server profile.
- Claude remains disabled until approval exists.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 14 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
