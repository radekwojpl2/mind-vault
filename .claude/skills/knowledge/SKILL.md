---
name: knowledge
description: Work with the mind-vault knowledge base. Use it to answer a question from the vault, capture something new into the inbox, triage the inbox, add or update a note (pattern, guide, lesson, project note, decision…), or run vault maintenance. Triggers on "add to the vault", "capture", "triage the inbox", "new pattern", "lesson notes", "what does the vault say about…", "check the vault".
---

# Knowledge: Working with mind-vault

The vault lives at `D:\git\mind-vault\docs` (GitHub `radekwojpl2/mind-vault`). Agents build and maintain it; the owner reads it in Obsidian. Read these before changing anything:

- `docs/context/Vault-Purpose.md`: what the vault is for, readers, rules
- `docs/okf/Vault-Profile.md`: required frontmatter (`type`, `status`, `confidence`, `source`, `updated`)
- `docs/okf/Note-Types.md`: which type to use, where it lives, what it contains

## Non-negotiables

- **Changes go through a PR.** Create a branch, make small commits, open a PR. Never push to `main`. Stack PRs when work builds on an unmerged branch.
- Never add `Co-Authored-By` trailers to commits.
- Write in **English**.
- Every touched section's `log.md` gets a dated entry (newest first) in the same PR.
- Run `node scripts/validate-vault.js` before every commit. It must print `OK`.
- Distil, don't copy. External systems (repos, issues, courses) stay the source of truth for their own data. The vault records what matters and where to find the rest.

## 1. Answer a Question from the Vault

1. Read `docs/index.md`, then `docs/context/Global.md`.
2. For a project, read `<Project>.index` → `<Project>-Context` → `<Project>-Board`, then the specific notes.
3. Otherwise open the matching section index and follow `[[links]]`. Grep `docs/` for names, tags and key terms when the indexes don't lead anywhere. Note names are unique, so `[[Name]]` maps to exactly one `Name.md`.
4. Check each note's frontmatter before relying on it. Flag `status: draft` or `outdated`, `confidence: low`, or an `updated` date more than about six months old.
5. Answer with **citations** (`[[Note]]` for each claim). If the vault doesn't cover something, say so and don't fill the gap from general knowledge without marking it as such.

## 2. Capture

Write `docs/inbox/<YYYY-MM-DD>-<slug>.md` with `type: Capture`, `status: draft`, `confidence: low`, a real `source`, and the raw content. Format and rules: `docs/inbox/Inbox.index.md`. Don't triage in the same step unless asked.

## 3. Triage the Inbox

For each capture:

1. Decide where it belongs (`Note-Types.md` → "Choosing a Type"; folders in `Vault-Structure.md`).
2. **Merge** into an existing note when one covers the topic. Grep first. Create a new note only when nothing fits.
3. Set real metadata on the result: `source` from the capture, `confidence` by how well it's backed, `updated` to today.
4. Link the result from its section index, plus related notes where it helps.
5. Delete the capture, and log where it went in the target section's `log.md`. Refer to a deleted note as `code`, not a `[[link]]`, because the validator rejects links to missing notes.
6. Leave anything you can't place in the inbox, and say why in the PR.

## 4. Add or Update a Note

1. **Pick the type** from `Note-Types.md` and use its "Usually contains" as guidance, not as a fixed template. Leave out empty sections.
2. **Name it uniquely** (`Glob docs/**/<Name>.md` must find nothing). Prefix project-specific notes with the project name if a generic note shares the name.
3. **Frontmatter:**
   ```yaml
   ---
   type: <Type>
   title: <optional display name>
   description: <optional one-liner>
   tags: [<section>, <topic>, ...]
   status: draft | stable | outdated | archived
   confidence: high | medium | low
   source: [<URL | author | conversation | environment | course:...>]
   updated: <today, YYYY-MM-DD>
   ---
   ```
   Use `confidence: high` only when you checked the source in this session.
4. **Link it:** add a `- [[Name]] — <one line>` entry to the section's `*.index.md` under the right heading, and link related notes both ways when it helps. Use `[[wiki-links]]` only, never `[text](path.md)` between notes.
5. **Log it** in the section's `log.md`.
6. **On an update:** bump `updated` only for meaningful content changes. If you find the note disagrees with its source and can't fix it now, set `status: outdated` and add a dated line at the top of the body saying what's wrong.

### Common cases

- **New pattern:** `docs/patterns/<Pattern-Name>.md`, `type: Pattern`, listed in `Patterns.index.md` under Domain / Application / Infrastructure / Architecture / Deployment. Sections: what it is → when to use / when not → minimal implementation → rules → trade-offs → real-world example linking the project note.
- **Course lesson:** `docs/learning/<Course>/<COURSE>-<Episode>-<Title>.md`, `type: Lesson`, summarised in your own words, ending with an *Applied in this vault / my work* table.
- **Project change** (merged PR, new feature): update `<Project>-Board`. Update `<Project>-Context` or module notes if the big picture changed. Mark affected notes `outdated` if you don't fix them.

## 5. Maintenance

Run on request, or on a schedule, and always deliver as a PR:

1. `node scripts/validate-vault.js`: fix every problem it reports.
2. Triage the inbox (section 3).
3. List notes with `status: draft` and an `updated` date more than 30 days old, and notes with `confidence: medium|low` and an `updated` date more than about 180 days old. Re-check them against `source` where possible, then raise confidence, fix the content, or mark them `outdated`.
4. Check each project board against its repo (open PRs and issues, the latest release) and update it.
5. Summarise what changed and what still needs the owner's input in the PR description.
