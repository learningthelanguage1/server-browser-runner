# Login Mode And Secret Env Handoff

## Problem

Login mode opened the provider browser but never exited on its own. The systemd
unit also contained a fake inline runner secret placeholder, which made it too
easy to leave secret handling inside the unit file.

## What was implemented

- Login mode now waits until the ChatGPT or Claude composer is visible.
- Login mode writes `.ff-session.json` into the provider profile with the latest
  status, URL, and check time.
- Login mode exits once the provider session is ready.
- The runner service now reads `/srv/ff-browser-runner/config/runner.env`.
- Deployment docs now describe the approved-secret env file path and permissions.

## Final result

The operator can run login mode over VNC and get a concrete ready/not-ready
session file instead of an infinite command. The service no longer stores a fake
secret in the systemd unit.

## What remains

- The shared runner secret still needs explicit operator approval before it is
  installed in Brain and on the runner server.
- ChatGPT still needs manual login over localhost-only VNC before live provider
  tasks can run.
- Claude remains disabled until an approval record exists.

## Verification

Pending local build and test after this handoff was written.

## Notion

Notion was not updated from this thread; the local handoff is the durable record
for this slice.
