# Login

Login is manual. The runner opens the provider page in the persistent profile;
the operator completes login through VNC.

The command exits after the provider composer is visible and writes a session
health file under the provider profile, for example:

```txt
/srv/ff-browser-runner/profiles/chatgpt/.ff-session.json
```

ChatGPT:

```bash
pnpm runner login --provider chatgpt --config /srv/ff-browser-runner/config/runner.yaml
```

Claude:

```bash
pnpm runner login --provider claude --config /srv/ff-browser-runner/config/runner.yaml
```

Claude is disabled by default and remains blocked until its permission status is
set to `approved`.

The runner does not automate MFA, captcha, passkeys, signup, or password entry.
If the command times out, it leaves the latest session status in
`.ff-session.json` and exits with `LOGIN_REQUIRED`.
