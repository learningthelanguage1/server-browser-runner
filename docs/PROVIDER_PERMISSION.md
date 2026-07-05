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

Claude is enabled because approval is now confirmed:

```yaml
providers:
  claude:
    enabled: true
    permission_status: approved
    permission_ref: claude_permission_2026_07
```

Keep the approval record under `/srv/ff-browser-runner/approval/`.
