# Claude Dynamic Send Control

## Problem

Claude reached the logged-in new-chat page, but self-check returned
`selector_broken` because the send button is not present until text is entered.

## Implemented

Changed Claude health to treat a detected composer as ready and expanded the
send selector used during execution.

## Final result

Claude readiness now reflects the actual product state: logged in with a
composer available.

## What remains

- 2026-07-06: Restart Claude login window if needed and run Claude self-check.
- 2026-07-06: ChatGPT still needs the Cloudflare human check completed in VNC.

## Verification

- 2026-07-06: `corepack pnpm test` passed locally with 16 runner checks.

Notion was not updated from this thread.
