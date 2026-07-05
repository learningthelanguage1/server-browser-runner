# Internal browser self-check

## Problem

The internal provider self-check returned `ready` without opening the owned
runner test page, so it did not prove that the server browser path could reach
the internal test UI.

## What was implemented

- Updated the internal browser adapter self-check to open the configured
  internal test page.
- The self-check now requires both the composer and send button before it
  reports `ready`.

## Final result

The internal self-check is now a real browser reachability and selector check
for the owned test page.

## What remains

- 2026-07-05: Live ChatGPT proof still needs the server runner secret and manual
  provider login over localhost-only VNC.
- 2026-07-05: Claude remains disabled until an approval record exists.

## Verification

- `pnpm build` passed locally.
- `pnpm test` passed locally with 8 tests.
- First server self-check exposed missing `DISPLAY`/browser-startup failure as an
  uncaught exception; the adapter now returns `unknown_error` instead of
  crashing when the browser cannot start.

## Notion

Notion was not updated because no related Notion handoff target was provided in
this thread.
