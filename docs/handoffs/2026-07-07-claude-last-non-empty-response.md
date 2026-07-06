# Claude Last Non-Empty Response Capture

## Problem

The live Claude proof task displayed the correct answer and done marker, but the runner still timed out. The screenshot showed the real Claude answer followed by a trailing spinner/empty message node. The adapter could watch an empty/trailing node instead of the completed answer, and the marker was visible on the page even when the watched response node did not expose it.

## What was implemented

- Claude execution now selects the last non-empty assistant response before waiting for the done marker.
- Claude completion can also use the page-body marker signal when the marker appears twice: once in the submitted prompt and once in Claude's visible answer.
- Claude capture can extract the answer from page body text when the visible answer is present but the response node/copy fallback returns empty.
- Added a regression test with a trailing empty Claude node.
- Added a regression test for external marker detection when the watched response node is empty.
- Added a regression test for page-body answer extraction.

## Final result

Claude can complete tasks when the answer is visible and a trailing spinner node remains in the DOM.

## Verification

- `corepack pnpm test`
- Result: `25` passed.

## Live proof

- Brain task: `task_claude_permission_test_004`
- Final status: `accepted`
- Clean result: `CLAUDE_BROWSER_RUNNER_OK`
- Capture method: `dom`

## What remains

- Push the runner branch when remote sync is approved.

## Notion

Not updated. No related Notion/Subnotion handoff was available in this thread.
