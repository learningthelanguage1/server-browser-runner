# ChatGPT Post-Paste Rate Limit Handoff

## Problem

During the live article chain, ChatGPT showed a `Too many requests` modal after
the runner pasted the prompt. The runner then waited for the send button and
reported `UNKNOWN_PROVIDER_ERROR`, hiding the real provider cooldown.

## What was implemented

- Added a post-paste ChatGPT health check before clicking or pressing send.
- If the page shows rate-limit text after paste, the runner returns
  `PROVIDER_COOLDOWN`.
- Added a regression test for ChatGPT too-many-requests health detection.

## Final result

The existing runner now classifies this provider state correctly. The article
chain can be retried after the ChatGPT account limit clears without creating a
new runner or duplicate lane.

## What remains

- Wait for ChatGPT's account-side request limit to clear.
- Requeue `article-chain-b031f146-9dc3-48f8-af22-731a5f098d0c-step_0` and
  continue the same live chain.

## Verification

- `corepack pnpm test` returned 18 passing tests.
- `ff-browser-runner.service` restarted and returned `active`.

## Notion

Notion was not updated from this thread; this local handoff is the durable record
for the runner slice.
