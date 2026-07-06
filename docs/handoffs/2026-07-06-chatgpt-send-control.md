# ChatGPT send control handoff

## Problem

The Portuguese article chain reached ChatGPT, but the runner did not start the
prompt because it required the send button to be visible before text was pasted.
On the live ChatGPT page, the send control can appear only after the prompt is in
the composer.

## What was implemented

- ChatGPT readiness now depends on the composer being available.
- The send selector includes the newer composer submit button.
- After pasting the prompt, the runner waits briefly for the send control.
- If the send control still is not visible, the runner presses Enter.

## Final result

The runner can move from pasted prompt to submitted prompt on the live ChatGPT
screen instead of stopping at selector detection.

## What remains

- 2026-07-06: Retry the Portuguese article chain and confirm the article reaches
  the publishing step.
- 2026-07-06: Keep hardening provider selectors after more live screenshots are
  collected.

## Verification

Pending: run the runner test suite, deploy the runner, and retry the live
Portuguese article chain.

## Notion

Not updated from this thread; local handoff recorded.
