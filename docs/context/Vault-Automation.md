---
type: Guide
title: Vault Automation
description: "How the vault maintains itself: validation, plus a daily Claude Code routine for board sync, inbox triage and weekly maintenance"
tags: [context, automation, routines, github-actions, maintenance, knowledge-management]
status: draft
confidence: medium
source: [author, conversation, course:MEGA.dev S01E03]
updated: 2026-10-28
---

# Vault Automation

The self-management part of [[MEGA-S01E03-Building-Knowledge-Systems]], put into practice. Every automated change arrives as a **PR**, never as a push to `main` ([[Vault-Purpose]]).

| Mechanism | Trigger | What it does | State |
|---|---|---|---|
| Pre-commit hook (`.githooks/pre-commit`) | local commit touching `docs/**/*.md` | runs `scripts/validate-vault.js`; blocks the commit on failure | active on the owner's clone (`git config core.hooksPath .githooks`) |
| `Validate vault` GitHub Action | every PR, push to `main` | the same validator in CI | active |
| **Claude Code routine "mind-vault daily sync"** | daily 06:00 UTC (07:00 Warsaw in winter, 08:00 in summer) | **daily:** merged PRs and new releases in the project repos → boards; inbox triage. **Mondays:** full maintenance (validator, stale notes, new repos in [[Global]]) → one PR | active (owner-managed at claude.ai/code/routines) |

This note stays `status: draft` until the routine's first PR has been reviewed.

## Why a Routine, Not GitHub Actions

The owner chose a scheduled Claude Code cloud agent (2026-10-28):
- no Anthropic API key stored in GitHub
- no sender workflows in the project repos

Routines can't be triggered by GitHub events, so merged PRs are picked up by the **daily** run rather than instantly. The cost is that a board lags by up to a day.

## How "Since Last Run" Works

Each project board starts with `Snapshot from <YYYY-MM-DD>`. The routine treats that date as the watermark. It looks for PRs merged and releases published since then, updates the board, and moves the snapshot date forward. If nothing changed, it opens no PR.

## Repos the Routine Checks Out

- `radekwojpl2/mind-vault` (writes, through PRs)
- `radekwojpl2/LinkStack` (private, read only)
- `radekwojpl2/blue-green-deployment-poc` (read only)
- `radekwojpl2/dotnet-nextjs-sentry-poc` (read only)

## Managing It

- Pause, edit or delete it at <https://claude.ai/code/routines>, or ask Claude Code (`/schedule`).
- The routine's prompt is self-contained. It points the agent at `CLAUDE.md` and `.claude/skills/knowledge/SKILL.md`, so vault rules change through those files, not by editing the routine.

## Safety

- **PRs only.** The `Validate vault` check must pass before the owner merges.
- The vault is **public** (owner's decision, 2026-10-28) and LinkStack is private. Notes summarise private-repo facts at the existing level and never copy secrets or source code.
