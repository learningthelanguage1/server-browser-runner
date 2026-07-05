# Troubleshooting

Check runner health:

```bash
pnpm runner self-check --provider chatgpt --config /srv/ff-browser-runner/config/runner.yaml
```

Common states:

- `LOGIN_REQUIRED`: open VNC and complete provider login manually.
- `PROVIDER_PERMISSION_BLOCKED`: provider is disabled or lacks approval.
- `DOMAIN_NOT_ALLOWED`: task target is outside the provider allowlist.
- `PROVIDER_RATE_LIMITED`: wait for the configured cooldown.
- `SELECTOR_CHANGED`: provider UI changed and the adapter selectors need an update.

Captured provider answers are written to the local SQLite spool before Brain
submission so a temporary Brain outage does not lose a completed answer.
