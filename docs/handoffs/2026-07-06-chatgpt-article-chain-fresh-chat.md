# ChatGPT Article Chain Fresh Chat

Date: 2026-07-06

## Problem

Live Portuguese article-chain proof showed the existing server runner was
pasting article-chain prompts into an existing ChatGPT conversation. The chain
advanced, but ChatGPT answered with stale context and reported the primary
keyword as missing.

## What Was Implemented

- Detect ChatGPT article-chain tasks from their `article-chain-*` id and
  `article_prompt_chain` metadata.
- Open a fresh ChatGPT chat before pasting article-chain prompts.
- Keep ordinary ChatGPT tasks on the existing behavior.
- Added a unit assertion for the article-chain detector.

## Final Result

The existing `/srv/ff-browser-runner/app` lane remains the runner. Article-chain
prompts now start from a clean ChatGPT chat, while Brain carries the keyword and
prior-step context in the prompt payload.

## What Remains

- [2026-07-06 active] Continue the live Portuguese article chain after the
  Brain prompt-context deploy and verify Content Machine handoff.

## Verification

- `corepack pnpm test` returned 19 passing tests.
