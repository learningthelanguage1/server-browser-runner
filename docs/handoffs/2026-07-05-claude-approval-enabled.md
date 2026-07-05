# Claude Approval Enabled Handoff

Date: 2026-07-05

## Problem

Claude was implemented but disabled because approval had not been confirmed.

## What was implemented

- Enabled Claude in the runner config.
- Recorded `claude_permission_2026_07` as the Claude approval reference.
- Updated provider docs and open items so Claude is now waiting on login/proof,
  not approval.
- Recorded the operator preference to prioritize end-to-end flow proof before
  optional hardening.

## Final result

The runner is ready to attempt Claude login/proof once the server config is
updated and the shared runner secret/login steps are complete.

## What remains

- Install the shared runner secret on Brain and runner.
- Log into Claude through the server browser profile.
- Queue and prove the Claude test task.

## Verification or acceptance evidence

- `corepack pnpm build` passed.
- `corepack pnpm test` passed with 14 runner guard checks.

## Notion

Notion was not updated from this thread; the local handoff is the durable record.
