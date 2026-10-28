---
type: Index
tags: [index, inbox]
---

# Inbox

The single entry point for new knowledge. Everything new (a link, a bookmark, a read-later item, a PoC finding, a course lesson, a thought) lands here first as a **capture**. An agent then triages it into the right section and removes it from the inbox, through a PR.

## How to Capture

Create `docs/inbox/<YYYY-MM-DD>-<short-slug>.md`:

```yaml
---
type: Capture
tags: [inbox]
status: draft
confidence: low
source: [<URL, repo, course:..., or author>]
updated: <YYYY-MM-DD>
---

<raw content: a link, pasted text, bullet notes. No structure required.>
```

## Triage Rules

- **Distil, don't copy.** Merge the capture into an existing note when one covers the topic. Otherwise create a new note in the right section ([[Vault-Structure]]).
- Set real `status`, `confidence` and `source` on the result ([[Vault-Profile]]).
- Delete the capture once it has been triaged. The section's `log.md` records where it went.
- If a capture doesn't fit anywhere, leave it here and say why in the PR.

## Waiting

- [[2026-10-28-bgd-rename-note-drift]] — the blue-green rename note disagrees with the real migrations
- [[2026-10-28-ai-migration-review-drift]] — model, output format and `HEAD~1` push gap
- [[2026-10-28-expand-contract-catch-up-backfill]] — add the catch-up backfill step to Expand-Contract

## Reference

- [[log]] — change history for this directory
