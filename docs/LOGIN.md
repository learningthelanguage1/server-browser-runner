# Login

Login is manual. The runner opens the provider page in the persistent profile;
the operator completes login through VNC.

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
