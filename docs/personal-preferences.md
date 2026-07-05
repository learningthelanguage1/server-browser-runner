# Personal Preferences

- 2026-07-05: Keep the runner dumb. Brain/FunFluen OS owns prompt chains, queue policy, retry policy, approvals, and publishing authority.
- 2026-07-05: Do not use provider APIs for this runner. It may call only Brain/FunFluen OS internal APIs.
- 2026-07-05: Do not automate captcha, MFA, passkeys, signup, provider protective checks, or account rotation.
- 2026-07-05: Claude approval is confirmed for the runner; keep Claude enabled behind `claude_permission_2026_07`.
- 2026-07-05: Keep runner and Brain changes in their owning repositories and push each code change only to the correct remote.
- 2026-07-05: Prioritize proving the full runner flow now; do not spend extra cycles on optional hardening before the flow works.
