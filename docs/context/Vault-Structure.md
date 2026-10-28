---
type: Decision
title: Vault Structure — Options and Decision
description: "Candidate layouts for the vault compared against Vault-Purpose, with a recommendation"
tags: [context, structure, decision, knowledge-management, para, zettelkasten, diataxis, moc]
status: stable
confidence: high
source: [author, conversation, course:MEGA.dev S01E03]
updated: 2026-10-28
---

# Vault Structure — Options and Decision

**Decided: Option A** (see [Decision](#decision)). This note covers issue #1, Phase 4, steps "Build context" and "Initialize structure". The requirements are in [[Vault-Purpose]].

## Strategies Considered

| Strategy | Core idea | Fit for this vault |
|---|---|---|
| **PARA** (Projects / Areas / Resources / Archive) | Organise by how actionable something is | Good for separating active projects from reference. Weak for agents, because a note's folder changes as its status changes |
| **Zettelkasten** | Atomic notes plus dense links; structure comes from links, not folders | Good fit for learning notes. Overkill for project reference docs |
| **Diátaxis** (tutorial / how-to / reference / explanation) | Classify docs by the reader's need | Useful as `type` values, not as folders. Already partly used (`Guide`, `Reference`) |
| **MOCs** (maps of content) | Hand- or agent-curated index notes as entry points | Already in use: `*.index.md`, root [[index]] |
| **Johnny.Decimal** | Numbered areas and categories | Stable addresses for humans. No real benefit for agents, which use names and grep |

**Constraints from the current vault:**
- Links are name-based and names are unique, so moving folders doesn't break links.
- The SpecKit finalize extension writes to `docs/projects/<Project>/`, so that path must stay.
- Agents find notes through [[index]] and grep. Folders mostly help humans and narrow a grep's scope.

## Options

### A: Extend the current layout (recommended)

```
docs/
  index.md             root map, split into "Work reference" and "Learning" zones
  inbox/               single entry point for raw captures (new)
  context/             global context, purpose, structure decision
  patterns/ testing/ documentation/ db/      work reference, unchanged
  projects/<Project>/  unchanged
  learning/            new
    <Course>/          e.g. MEGA-dev/: one note per lesson (MEGA-S01E03-Building-Knowledge-Systems)
    research/          PoC findings (HttpQuery, ODataPoc, JsonApiPoc, …)
  writing/             unchanged
  okf/ speckit/        system and tooling, unchanged
```

- The two zones are expressed in the root index, not in folders.
- Archiving uses `status: archived`. The note stays where it is, so its path never changes.
- **Pros:** no moves; existing paths (SpecKit extension, `CLAUDE.md`, other repos' constitutions) keep working; smallest diff.
- **Cons:** the top level grows to about 12 folders, and the folders themselves don't make the work/learning split visible.

### B: PARA

```
docs/
  inbox/
  projects/<Project>/                 active projects (path kept)
  areas/patterns/ areas/testing/ areas/documentation/ areas/db/
  resources/learning/ resources/writing/ resources/okf/ resources/speckit/
  archive/
  context/ index.md
```

- **Pros:** a well-known method, and it separates actionable work from reference material.
- **Cons:** moves most folders. Archiving moves files, so paths change and Obsidian folder views get churn. "Areas" is a fuzzy category for an agent to classify into.

### C: Purpose zones as folders

```
docs/
  inbox/
  context/ index.md
  reference/patterns/ reference/testing/ reference/documentation/ reference/db/
  projects/<Project>/                 path kept
  learning/<Course>/ learning/research/ learning/writing/
  system/okf/ system/speckit/
```

- **Pros:** the folders mirror [[Vault-Purpose]] exactly, and grep can be scoped by zone (`docs/learning`).
- **Cons:** moves most folders. `projects/` sits outside the zones because the SpecKit extension needs that path.

## Comparison

| Criterion | A | B | C |
|---|---|---|---|
| Matches purpose (work + learning) | via index | partly | via folders |
| Files moved | 0 | ~45 | ~45 |
| Paths stable over a note's life | yes | no (archive moves) | yes |
| Easy for an agent to classify a capture | yes (by kind) | harder ("area" or "resource"?) | yes (by zone) |
| Keeps SpecKit and other repos' paths working | yes | yes | yes |

## Recommendation

**Option A.** It meets every requirement in [[Vault-Purpose]] with no moves. The lesson's guidance applies here: keep it simple and rely on the agent's skill and indexes rather than on folder hierarchy. If grep scoping by zone becomes a real need, switching to C later is mechanical, because links are name-based.

## Decision

**2026-10-28: Option A chosen by the owner.** Implemented by adding [[Inbox.index]], [[Learning.index]] (with `MEGA-dev/` and a planned `research/`), and a root [[index]] split into Work reference / Learning / System zones. No existing files moved.
