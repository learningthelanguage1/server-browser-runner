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

- 2026-07-06: `corepack pnpm test` passed locally with 16 runner checks.
- 2026-07-06: Pushed to `learningthelanguage1/server-browser-runner`
  `development` at commit `e6b8d8e`.
- 2026-07-06: Deployed to `/srv/ff-browser-runner/app`, built with
  `corepack pnpm build`, and restarted `ff-browser-runner`.
- 2026-07-06: ChatGPT and Claude login windows were reopened in VNC through
  regular Google Chrome with persistent provider profiles.

Notion was not updated from this thread.
