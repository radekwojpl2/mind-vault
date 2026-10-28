---
type: Guide
title: Vault Automation
description: "How the vault maintains itself: validation, weekly maintenance, event-driven updates, and how to set them up"
tags: [context, automation, github-actions, maintenance, events, knowledge-management]
status: draft
confidence: medium
source: [author, conversation, course:MEGA.dev S01E03]
updated: 2026-10-28
---

# Vault Automation

The self-management part of [[MEGA-S01E03-Building-Knowledge-Systems]], put into practice. Every automated change arrives as a **PR**, never as a push to `main` ([[Vault-Purpose]]).

| Mechanism | Trigger | What it does | State |
|---|---|---|---|
| Pre-commit hook (`.githooks/pre-commit`) | local commit touching `docs/**/*.md` | runs `scripts/validate-vault.js` and blocks the commit on failure | **active** on the owner's clone |
| `Validate vault` workflow | every PR, push to `main` | the same validator in CI | **active** |
| `Vault maintenance` workflow | Mondays 06:00 UTC, or manual | the knowledge skill's §5: validate, triage the inbox, re-check stale notes and boards, detect new repos → one PR | **inert** until secrets are set |
| `Vault event` workflow | `repository_dispatch` `source-pr-merged` from a project repo | decides whether a merged PR changes the vault, usually a board move → PR | **inert** until secrets are set and senders are added |

This is `status: draft` because the two agent workflows haven't run yet. Set it to `stable` after the first successful run.

## Setup (owner)

1. **Anthropic API key:** add the repo secret `ANTHROPIC_API_KEY` to `radekwojpl2/mind-vault` (Settings → Secrets and variables → Actions). Without it, both agent workflows log "skipping" and exit.
2. **Read token for source repos:** LinkStack is **private**, so the agent needs a fine-grained PAT with **read-only** *Contents*, *Pull requests*, *Issues* and *Metadata* on `LinkStack`, `blue-green-deployment-poc` and `dotnet-nextjs-sentry-poc`. Store it as `VAULT_SOURCE_READ_TOKEN`. Writes to the vault itself use the workflow's own `GITHUB_TOKEN`.
3. **Let Actions open PRs:** Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests".
4. **Try it:** Actions → *Vault maintenance* → *Run workflow*. Review the PR it opens.

## Event Senders (one per project repo)

Add this workflow to each project repo. It needs a secret `MIND_VAULT_DISPATCH_TOKEN`: a fine-grained PAT on `mind-vault` with *Contents: read and write*, which the dispatch API requires.

```yaml
# .github/workflows/notify-mind-vault.yml
name: Notify mind-vault
on:
  pull_request:
    types: [closed]
    branches: [master, main]
jobs:
  notify:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - env:
          GH_TOKEN: ${{ secrets.MIND_VAULT_DISPATCH_TOKEN }}
          REPO: ${{ github.repository }}
          PR: ${{ github.event.pull_request.number }}
        run: |
          gh api repos/radekwojpl2/mind-vault/dispatches \
            -f event_type=source-pr-merged \
            -f "client_payload[repo]=$REPO" \
            -f "client_payload[pr]=$PR"
```

The payload carries only the repo and PR number. The vault agent reads the PR itself with the read token, so no PR text passes through the dispatch.

## New Repositories

GitHub has no repository-level "repo created" event. The weekly maintenance run compares `gh repo list radekwojpl2` with the Repositories table in [[Global]] instead, and adds new repos as "not yet documented".

## Safety

- **PRs only.** The agents work on `maintenance/<date>` or `event/<repo>-pr-<n>` branches. The `Validate vault` check must pass before the owner merges.
- **Least privilege.** The source token is read-only, and the dispatch token is scoped to the vault repo.
- **The vault is public** (`radekwojpl2/mind-vault`) while LinkStack is private. The agent prompts forbid copying secrets or private source code, and private-repo facts stay at the level already in `projects/LinkStack/`.
- Both agent workflows share a concurrency group, so they never edit the vault at the same time.
- Cost: one agent run a week, plus one per merged PR in the source repos.
