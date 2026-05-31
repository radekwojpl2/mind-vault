Add a new pattern note to the vault.

**Usage:** `/new-pattern <PatternName> <Category>`

Categories: `Domain` | `Application` | `Infrastructure` | `Architecture` | `Deployment`

**Example:** `/new-pattern Repository-Pattern Domain`

---

Arguments: $ARGUMENTS

Parse the pattern name (first argument, kebab-case) and category (second argument) from the arguments above.

## Steps

### 1. Create `docs/patterns/<PatternName>.md`

Use this exact structure:

```
---
tags: [pattern, <lowercase-tags-relevant-to-the-pattern>]
---

# <Human Readable Pattern Name>

## What It Is

<2-3 sentence explanation of what the pattern is and the core idea behind it.>

## When to Use

- <condition>
- <condition>

## When NOT to Use

- <condition>
- <condition>

## Implementation

<Minimal, copy-paste-ready code example. Use the language most relevant to the pattern — default to C# for backend patterns. Break into numbered sub-sections if multiple steps are needed.>

## Rules

- **<Rule name>** — <one-line explanation>

## Trade-offs

| Pro | Con |
|-----|-----|
| <benefit> | <drawback> |
```

Only include sections that have real content. Omit `## Rules` if there are no crisp, named rules. Omit `## Real-World Example` unless a concrete project reference exists.

### 2. Update `docs/patterns/Patterns.md`

Add a `[[<PatternName>]]` entry under the correct category section using this format:

```
- [[<PatternName>]] — <short one-line description matching the note's opening sentence>
```

Read the current `Patterns.md` first, then insert the new line in alphabetical order within the correct category. Do not rewrite the whole file — use a targeted edit.
