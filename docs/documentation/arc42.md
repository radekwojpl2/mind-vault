---
tags: [documentation, architecture, arc42, framework]
---

# arc42 Architecture Documentation

## What It Is

**arc42** is a template for documenting software and system architecture. It provides 12 sections that cover everything from high-level goals to deployment topology to known risks. It is designed to be filled in incrementally — start with the sections that matter most, leave the rest as stubs.

It replaces the question "what should we document about our architecture?" with a predefined structure that experienced architects have already answered.

## When to Use

- A new project needs a canonical architecture reference that survives beyond its original developers
- A team is onboarding people who need to understand the system quickly
- You want a single place that answers "what is this system, why does it exist, and how is it built?"

A small hobby project doesn't need arc42. A production system with multiple modules, external dependencies, and stakeholders does.

## The 12 Sections

| Section | Name | Answers |
|---------|------|---------|
| ARCH-01 | Introduction and Goals | What does the system do? Who are the stakeholders? What are the quality goals? |
| ARCH-02 | Constraints | What non-negotiable limits shape the architecture? (legal, technical, organisational) |
| ARCH-03 | Context and Scope | What systems does it integrate with? What is inside vs. outside the system boundary? |
| ARCH-04 | Solution Strategy | What are the key architectural decisions and approaches? |
| ARCH-05 | Building Block View | What are the components and how do they relate? (Level 1, 2, 3) |
| ARCH-06 | Runtime View | How do the components interact at runtime? (sequence diagrams, flows) |
| ARCH-07 | Deployment View | Where does the software run? (infrastructure, containers, environments) |
| ARCH-08 | Cross-cutting Concepts | How are horizontal concerns handled? (auth, logging, error handling, persistence) |
| ARCH-09 | Architecture Decisions | Summary of major decisions (link to ADRs) |
| ARCH-10 | Quality Requirements | Specific, measurable quality goals (performance, availability, security) |
| ARCH-11 | Risks and Technical Debt | Known risks and accepted shortcuts |
| ARCH-12 | Glossary | Domain and technical terms defined |

## Where to Start

Don't fill all 12 sections before shipping. Start with the three most valuable:

1. **ARCH-01 (Introduction & Goals)** — who is the system for and what must it do well
2. **ARCH-03 (Context & Scope)** — what does the system talk to; draw the C4 context diagram
3. **ARCH-05 (Building Block View)** — what are the main modules and their responsibilities

Add the remaining sections as the system matures or as questions arise.

## File Structure

```
docs/arch42/
  ARCH-01-introduction-goals.md
  ARCH-02-constraints.md
  ARCH-03-context-scope.md
  ARCH-04-solution-strategy.md
  ARCH-05-building-blocks.md
  ARCH-06-runtime-view.md
  ARCH-07-deployment-view.md
  ARCH-08-cross-cutting-concepts.md
  ARCH-09-architecture-decisions.md
  ARCH-10-quality-requirements.md
  ARCH-11-risks-technical-debt.md
  ARCH-12-glossary.md
```

## Section Template

Each section follows a consistent structure:

```markdown
---
title: "ARCH-05 Building Block View"
tags: [arc42, architecture, components]
---

# Building Block View

## Level 1 — System Overview
[Top-level component breakdown with responsibilities]

## Level 2 — Module Detail
[Per-module breakdown]

## Level 3 — Key Components
[For complex modules, go one level deeper]

---
[← ARCH-04 Solution Strategy](ARCH-04-solution-strategy.md) |
[ARCH-06 Runtime View →](ARCH-06-runtime-view.md)
```

Navigation links between sections keep the docs browsable without relying on a search tool.

## Maintenance

arc42 docs live at the architecture level — they describe the system's shape, not a specific feature. Update them when:
- A new module is added
- A key external dependency changes
- The deployment topology changes
- A cross-cutting concern is re-implemented

They do **not** need to be updated for every ADR or feature. Treat them as a system map, not a changelog.

## Relationship to ADRs

ARCH-09 (Architecture Decisions) is a summary index that links to the full [[ADRs]] folder. arc42 describes the *result* of decisions; ADRs describe the *reasoning*.

## Quality Requirements (ARCH-10)

Use ISO 25010 quality characteristics:

```markdown
| Priority | Quality Goal | Scenario |
|----------|-------------|----------|
| High | Reliability | System handles 100 concurrent users with p99 < 500ms |
| High | Security | All user data is tenant-isolated; no cross-tenant leakage possible |
| Medium | Maintainability | A developer with 1 week onboarding can add a new module independently |
```

Make quality goals measurable — "fast" and "secure" are not quality goals.

## Real-World Example

- `docs/arch42/` in LinkStack — all 12 sections filled, ISO 25010 quality framework, 3-level building block view, C4 context and container diagrams
