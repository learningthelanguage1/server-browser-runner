# ChatGPT Generation Idle

## Problem

Live article-chain Step 5 showed ChatGPT still generating with the stop button
visible, but the runner captured the first stable text fragment as if the answer
were complete. Brain correctly rejected the short process note, but the runner
needed to wait for ChatGPT to finish.

## What Was Implemented

- The completion detector now accepts a provider busy check.
- The ChatGPT adapter treats the visible stop-generation button as busy.
- Stable answer text is accepted only after ChatGPT is no longer generating.
- A focused regression test proves stable text is not returned while the busy
  check is active.

## Final Result

ChatGPT article-chain tasks should wait for the completed answer instead of
submitting early process notes.

## What Remains

- 2026-07-06: Deploy to `/srv/ff-browser-runner/app`.
- 2026-07-06: Let the live Portuguese Step 5 retry after provider cooldown.

## Verification

- `corepack pnpm test` passed with 22 tests.
