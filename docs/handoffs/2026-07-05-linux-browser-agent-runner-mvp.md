# Linux Browser Agent Runner MVP

## Problem

Build a Linux Browser Agent Runner that polls Brain/FunFluen OS for browser LLM
tasks, executes only permitted provider browser sessions, captures answers, and
submits results back to Brain without using provider APIs.

## Implemented

- TypeScript runner project with config schema.
- Brain client for register, heartbeat, claim, submit, fail, and artifact upload.
- Provider permission gate and domain allowlist.
- Local SQLite spool that saves results before Brain submission.
- One-active-task runner loop and local rate-limit guard.
- Fake echo adapter for queue testing without browser fragility.
- Internal web adapter for owned-page browser pipeline testing.
- ChatGPT and Claude browser adapters with persistent profiles, login/rate-limit
  checks, done-marker waiting, copy/DOM capture, screenshots, and permission gates.
- Linux install scripts, Xvfb/window-manager/VNC/systemd units, and deployment docs.

## Final Result

The repository now contains a runnable MVP implementation on the `development`
branch. Live provider proof is intentionally gated on real Brain endpoints,
manual login, and provider approval state.

## What Remains

- Brain server queue endpoints and the internal runner test page are now deployed
  live in FunFluen OS at commit `c85b4f70288a93b3273ea22d7da33e14edad71ff`.
- Configure the matching runner secret on Brain and the runner service.
- Log in to the ChatGPT profile on the Linux server over localhost-only VNC.
- Keep Claude disabled until approval exists.
- Harden provider selectors after the first live screenshots.

## Verification

Run:

```bash
pnpm install
pnpm build
pnpm test
```

Acceptance covered locally:

- Fake task succeeds.
- Domain allowlist rejects unsafe targets.
- Claude permission gate blocks by default.
- Local spool can save and delete pending submissions.
