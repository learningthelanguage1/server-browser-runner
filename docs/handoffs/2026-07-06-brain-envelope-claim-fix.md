# Brain Envelope Claim Fix

## Problem

The live Brain endpoints return payloads inside a `{ data, error }` envelope.
The runner read top-level `task` and artifact fields, so live claimed tasks
could be ignored or submitted without the returned artifact receipt.

## Implemented

Unwrapped Brain response envelopes in the runner client before the caller reads
claim, submit, fail, or artifact-upload fields.

## Final result

The deployed server checkout has the same fix and the local repo now records it
for the runner source of truth.

## What remains

- 2026-07-06: Run the ChatGPT browser proof after the provider session is
  confirmed ready in the automation profile.

## Verification

- 2026-07-06: Server preflight passed with runner secret, display, spool,
  artifacts, ChatGPT approval, and Claude approval.
- 2026-07-06: Brain `/health` returned healthy.

Notion was not updated from this thread.
