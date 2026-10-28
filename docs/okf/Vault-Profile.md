---
type: Reference
title: Vault OKF Profile
description: "This vault's extensions to OKF v0.1: trust and freshness fields every concept note carries"
tags: [okf, profile, frontmatter, metadata, knowledge-management]
status: stable
confidence: high
source: [author]
updated: 2026-10-28
---

# Vault OKF Profile

This vault follows [[Spec]] (OKF v0.1) plus the extra frontmatter fields below. OKF allows producer-defined keys, so the vault stays valid OKF.

The fields answer three questions an agent has to settle before relying on a note: **is it finished, where did it come from, and is it still current?**

## Fields

| Field | Required on | Values | Meaning |
|---|---|---|---|
| `type` | every note | free text (`Pattern`, `Guide`, `Module`, `Context`, `Board`, …) | OKF core field |
| `status` | concept notes | `draft` · `stable` · `outdated` · `archived` | Lifecycle of the note |
| `confidence` | concept notes | `high` · `medium` · `low` | How well the content is backed |
| `source` | concept notes | list of URIs or keywords | Where the knowledge came from |
| `updated` | concept notes | `YYYY-MM-DD` | Last *meaningful* content change (not link or format fixes) |

"Concept notes" means every note except `*.index.md` and `log.md`. Those are structural and only need `type`.

### `status`

- `draft`: incomplete or not yet reviewed. Use with care.
- `stable`: complete and believed current.
- `outdated`: known to disagree with reality. Put a line at the top of the body saying what changed and where.
- `archived`: kept for history only. Don't use it as guidance.

### `confidence`

- `high`: checked against the source (code, repo, docs, a command's output) on the `updated` date.
- `medium`: written from the source or experience, but not re-checked since. This is the default for backfilled notes.
- `low`: inferred, second-hand or speculative.

### `source`

A YAML list. Use the most specific value available:

- a URL, e.g. `https://github.com/radekwojpl2/LinkStack` or a docs page
- `author`: the vault owner's own knowledge or experience
- `conversation`: produced with an agent in a session and not traced to another source
- `course:<name>`, e.g. `course:MEGA.dev S01E03`
- `environment`: read from the local machine (commands, config)

When a note distils a project repo, list the repo URL. `resource` (OKF) names the asset a note *describes*; `source` names where the *knowledge* came from. They may be the same URL.

## Rules for Agents

- On any meaningful edit, set `updated` to today. Raise `confidence` to `high` only if you checked the source in that session.
- When you find drift between a note and its source, set `status: outdated` and add a dated line at the top of the body, unless you fix the note in the same change.
- Weigh `status: draft`, `confidence: low` and an old `updated` date when answering. Say so if the answer depends on such a note.

## Example

```yaml
---
type: Module
tags: [linkstack, module, links]
status: stable
confidence: medium
source: [https://github.com/radekwojpl2/LinkStack]
updated: 2026-06-19
---
```
