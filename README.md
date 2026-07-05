# FunFluen Linux Browser Agent Runner

Linux browser worker for Brain/FunFluen OS tasks.

The runner:

- polls Brain for one browser task at a time
- checks provider permission and target domain allowlists
- uses persistent Playwright browser profiles
- stores captured results in local SQLite before submitting to Brain
- supports fake, internal web, ChatGPT, and Claude adapters
- keeps Claude disabled by default until approval exists

It does not call provider APIs, publish content, rotate accounts, automate MFA,
solve captcha, or browse arbitrary domains.

Quick start:

```bash
pnpm install
pnpm build
pnpm test
pnpm runner self-check --provider fake_echo
```
