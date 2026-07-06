# Real Chrome Provider Launch

## Problem

Provider login through the VNC browser hit robot/login friction. The runner's
shared browser opener still launched provider sessions through Playwright's
managed Chrome path.

## Implemented

Changed the shared browser profile manager so headed Chrome provider sessions
start regular `google-chrome` with a persistent profile and attach over local
remote debugging. All existing adapters reuse this path.

## Final result

Login, self-check, and provider execution now use the same regular Chrome
profile path when `browser.channel` is `chrome` and `headless` is false.

## What remains

- 2026-07-06: Re-run ChatGPT login/self-check and the first ChatGPT proof task.

## Verification

- 2026-07-06: Pending after deployment to the runner server.

Notion was not updated from this thread.
