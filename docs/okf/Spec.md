---
type: Reference
tags: [okf, spec, format, knowledge-management]
resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
---

# Open Knowledge Format (OKF) — Spec Reference

**Version 0.1 — Draft**

A minimal, open format for representing knowledge as a directory of Markdown files with YAML frontmatter. Human-readable, agent-parseable, diffable in git, portable across tools.

---

## Bundle Structure

A bundle is a directory tree of `.md` files. Structure is producer-defined.

```
bundle/
├── index.md          # optional — directory listing for progressive disclosure
├── log.md            # optional — chronological change history
├── <concept>.md
└── <subdir>/
    ├── index.md
    └── <concept>.md
```

**Reserved filenames** (cannot be used for concept documents):

| File       | Purpose               |
|------------|-----------------------|
| `index.md` | Directory listing     |
| `log.md`   | Update history        |

---

## Concept Documents

Every concept is a UTF-8 `.md` file with:
1. A **YAML frontmatter block** (`---` delimited)
2. A **markdown body**

### Frontmatter

```yaml
---
type: <Type name>           # REQUIRED — e.g. Table, API Endpoint, Playbook, Reference
title: <display name>       # recommended
description: <one-liner>    # recommended
resource: <URI>             # recommended — canonical URI of the underlying asset
tags: [tag, tag]            # optional
timestamp: 2026-01-01T00:00:00Z  # optional — last meaningful change
# any producer-defined extra fields are allowed
---
```

- `type` is **not** centrally registered — pick descriptive values; consumers must tolerate unknown types
- Extra frontmatter keys are allowed and should be preserved by consumers

### Conventional body sections

| Heading       | Use when                                              |
|---------------|-------------------------------------------------------|
| `# Schema`    | Describing columns/fields of an asset                 |
| `# Examples`  | Concrete usage examples                               |
| `# Citations` | External sources backing claims (numbered, see §8)    |

---

## Index Files

`index.md` MAY appear in any directory. No frontmatter. Body groups concepts under headings:

```markdown
# Group Heading

* [Title](relative-url.md) - short description
* [Subdirectory](subdir/) - short description
```

Descriptions should come from the linked concept's `description` frontmatter field. May be generated automatically.

---

## Log Files

`log.md` MAY appear at any level. Newest entry first. Dates in `YYYY-MM-DD` ISO 8601.

```markdown
# Directory Update Log

## 2026-05-22
* **Update**: Added [Customer Metrics](/tables/customer-metrics.md).
* **Creation**: Established the [Dataplex Playbook](/playbooks/dataplex.md).

## 2026-05-15
* **Initialization**: Created foundational directory structure.
```

Leading bold word (`**Update**`, `**Creation**`, `**Deprecation**`) is convention, not required.

---

## Cross-linking

Two forms:

**Bundle-relative (recommended)** — stable across moves within a subdir:
```markdown
See the [customers table](/tables/customers.md).
```

**Relative:**
```markdown
See the [neighbor](./other.md).
```

Links express relationships; the type of relationship is conveyed by surrounding prose. Consumers must tolerate broken links.

---

## Citations

Numbered list under `# Citations` at the bottom of a document:

```markdown
# Citations

[1] [BigQuery announcement](https://cloud.google.com/blog/...)
[2] [Internal runbook](https://wiki.acme.internal/data/quality)
```

---

## Conformance (v0.1)

A bundle is conformant if:
1. Every non-reserved `.md` file has a parseable YAML frontmatter block
2. Every frontmatter block has a non-empty `type` field
3. Reserved filenames follow the structure in this spec

Consumers must **not** reject bundles for missing optional fields, unknown types, unknown frontmatter keys, broken links, or missing `index.md` files.

---

## Relationship to Other Formats

OKF is close to:
- LLM wiki repos using markdown + frontmatter as agent-readable knowledge bases
- Personal knowledge tools (Obsidian, Notion) — hierarchical markdown with cross-links
- "Metadata as code" approaches (catalog metadata alongside source)

Difference: OKF **specifies** the minimal set of rules needed for interoperability without dictating tooling.
