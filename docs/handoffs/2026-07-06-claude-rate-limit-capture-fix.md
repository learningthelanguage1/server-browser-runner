# Claude Rate Limit Capture Fix

## Problem

The live Claude proof reached the provider page and sent the prompt, but Claude
returned a session-limit message. Because the Claude answer selector included
the whole page, the captured text included the original prompt and done marker,
so Brain accepted a false success.

## Implemented

- Detect Claude rate/session-limit UI immediately after sending.
- Remove the `main` whole-page fallback from Claude answer capture.

## Final result

Claude rate limits should now become `PROVIDER_RATE_LIMITED` failures instead
of accepted results.

## What remains

- 2026-07-06: Re-run Claude proof after the session limit resets.
- 2026-07-06: ChatGPT still needs the Cloudflare human check completed in VNC.

## Verification

- 2026-07-06: `corepack pnpm test` passed locally with 16 runner checks.

Notion was not updated from this thread.
