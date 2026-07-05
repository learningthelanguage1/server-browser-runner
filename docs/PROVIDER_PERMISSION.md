# Provider Permission

The runner only uses provider websites through browser sessions. It does not
call OpenAI or Anthropic APIs.

ChatGPT is enabled only when:

```yaml
providers:
  chatgpt:
    enabled: true
    permission_status: approved
    permission_ref: openai_permission_2026_07
```

Claude is implemented but disabled by default:

```yaml
providers:
  claude:
    enabled: false
    permission_status: not_approved
```

Add the approval record under `/srv/ff-browser-runner/approval/` before enabling
a provider that requires permission.
