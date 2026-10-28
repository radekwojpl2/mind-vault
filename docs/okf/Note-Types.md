---
type: Reference
title: Note Types
description: "Every note type used in the vault: what it is for, where it lives, how to name it and what a good one contains"
tags: [okf, templates, note-types, conventions, knowledge-management]
status: stable
confidence: high
source: [author, conversation]
updated: 2026-10-28
---

# Note Types

This page is guidance, not a set of rigid templates. Pick the type whose **purpose** matches the note, then choose the sections that serve it. The "Usually contains" column lists what a good note of that type tends to have. Leave out sections that would be empty, and add ones the content needs.

Frontmatter for every type follows [[Vault-Profile]]. Indexes and logs only need `type` and `tags`.

## Work Reference

| Type | Purpose | Lives in | Name | Usually contains |
|---|---|---|---|---|
| `Pattern` | A reusable engineering solution, independent of any project | `patterns/` | `<Pattern-Name>` | What it is → when to use / when not → minimal copy-paste implementation → rules → trade-offs → real-world example (link to the project note) |
| `Pattern` (project) | How one project applies a pattern | `projects/<P>/Patterns/` | Plain name; prefix `<P>-` if a generic note has the same name | Where it lives in the code → the project's specific choices → links to the generic pattern and the modules that use it |
| `Guide` | How to do or understand something (setup, strategy, standards) | `testing/`, `documentation/`, `db/`, `projects/<P>/` | `<Topic>` | Goal → steps or explanation → gotchas → links |
| `Playbook` | Operational procedure you run when something happens | any work section | `<Task>` or `<tool>-<task>` | What it gives you → enable / prerequisites → commands → how to read results → limitations |
| `Script` | Copy-paste code or SQL with just enough context | next to the guide that uses it | `<verb>_<object>` | Purpose → the script → parameters → how to undo it |
| `Reference` | Facts to look up (a spec, field list, conventions) | `okf/`, any section | `<Subject>` | Tables first, prose second |
| `Architecture` | A project's structure and its hard rules | `projects/<P>/` | `<P>-Architecture` | Layers → module or service map → communication rules → constraints → startup or deploy flow |
| `Module` | One module or service inside a project | `projects/<P>/Modules/` | `<Module>` | Responsibility → projects/layers → entities → events in and out → endpoints → links |
| `Spec-Summary` | A SpecKit feature summary (written by the finalize extension) | `projects/<P>/Spec-Kit/` | `<feature-slug>` | Goal → scope → key decisions → architecture → test coverage → constitution deviations → open questions |

## Context and Status

| Type | Purpose | Lives in | Name | Usually contains |
|---|---|---|---|---|
| `Context` | Big picture an agent must read before details | `context/`, `projects/<P>/` | `Global`, `<P>-Context`, `Vault-*` | Purpose → feature or content map → where the code lives → reading order → glossary → known gaps and drift |
| `Board` | What's implemented, active, planned or archived | `projects/<P>/` | `<P>-Board` | Snapshot date → Active → Planned → Implemented → Archived; every item links to a note, spec, PR or issue |
| `Decision` | A choice between options and why it was made | `context/` or next to the subject | `<Subject>` or `<Subject>-Decision` | Context → options → comparison → recommendation → decision with date |

## Learning and Writing

| Type | Purpose | Lives in | Name | Usually contains |
|---|---|---|---|---|
| `Lesson` | Distilled notes from one course lesson | `learning/<Course>/` | `<COURSE>-<Episode>-<Title>` | Core idea → key points in my own words → **Applied in this vault / my work** table linking the notes it changed |
| `Research` | Findings from a PoC or investigation | `learning/research/` | `<Topic>-Research` | Question → what was tried (repo link) → findings, including negative ones → verdict → links to the pattern or decision it fed |
| `Backlog` | A list of ideas not yet started | `writing/` or any section | `<Topic>-Ideas` | Numbered ideas, each with a one-line angle and links |

## System

| Type | Purpose | Lives in | Name | Usually contains |
|---|---|---|---|---|
| `Capture` | Raw input waiting for triage | `inbox/` | `<YYYY-MM-DD>-<slug>` | Anything. Must have a `source` |
| `Index` | A section's listing (a map of content) | each section | `<Section>.index`, root `index` | Short purpose line → grouped `[[links]]` with one-line descriptions. No duplicated content |
| `Log` | A section's change history | each section | `log` | `## YYYY-MM-DD` entries, newest first, linking the notes changed |

## Choosing a Type

- If it would still be useful in a different project, it's a `Pattern` or `Guide` in a work section, not a project note.
- If it only says *what happened* or *what's next*, it belongs on a `Board`. If it says *why*, it's a `Decision`.
- If it came from a course, it's a `Lesson`. If it came from your own experiment, it's `Research`. Promote stable, reusable conclusions into a `Pattern` or `Guide`, and link back.
- A new type is allowed when none of these fit. Add it to this page in the same PR.

## Note or Skill?

- **Note:** "what is X / should I use X / what does it cost". Reference knowledge, kept here with metadata, links and validation.
- **Skill** (`.claude/skills/<name>/SKILL.md`): "how do I do X", where X is a repeatable procedure with a clear finish check. A skill holds the steps and checks and **links to notes for the content**. It never copies them, so fixing a note fixes the skill.
- Existing skills: `knowledge` (working with the vault) and `patterns` (routing design work to pattern notes). A pattern note becomes its own skill only when it's a procedure you run often; `safe-migration` from [[Expand-Contract]] is the next candidate.
