---
tags: [documentation, strategy, architecture, overview]
---

# Documentation Hierarchy Strategy

## The Problem

Documentation without structure becomes a dump. Developers write in the wrong place, architecture decisions get buried in Slack, and new joiners can't find anything. A clear hierarchy answers one question: *for this type of information, where does it live?*

## The Five Layers

```
1. Architecture docs      — what the system is and why it was built this way
2. Decision records       — every significant choice made, with context and alternatives
3. Module docs            — what each domain area owns and how it communicates
4. Feature specs & plans  — the what and how for each feature, before and during build
5. Coding guidelines      — prescriptive rules for how code must be written
```

Each layer serves a different reader and a different time horizon.

| Layer | Reader | Lifespan | Changes when |
|-------|--------|----------|-------------|
| Architecture | New joiners, architects | Months–years | System shape changes |
| Decisions (ADRs) | Anyone asking "why" | Permanent | Revisiting a decision |
| Module docs | Module owners, integrators | Months | Domain model changes |
| Specs / plans | Developers building a feature | Weeks | Feature scope changes |
| Guidelines | Developers writing code | Months–years | Convention changes |

## Layer 1 — Architecture Documentation

Describes the system at the highest level: goals, constraints, context, component breakdown, deployment. Written once and updated when the system's shape changes.

Use the [[arc42]] framework. Twelve sections from "Introduction & Goals" through "Glossary". Covers stakeholders, quality goals, technical decisions, and risks.

**Lives in:** `docs/arch/` or `docs/arch42/`

## Layer 2 — Architecture Decision Records (ADRs)

Every significant technical choice gets an [[ADRs|ADR]]: why was this decision made, what alternatives were considered, what are the consequences. ADRs are permanent — even superseded ones stay in the record.

**Lives in:** `docs/decisions/`

## Layer 3 — Module Documentation

One document per module (or bounded context) in a modular/DDD project. Describes the module's purpose, aggregates, events it publishes and consumes, and cross-module dependencies. See [[projects/LinkStack/Modules/Links]] for an example.

**Lives in:** `docs/modules/`

## Layer 4 — Feature Specs and Plans

Short-lived during a feature's build. A spec describes *what* the feature does (BDD scenarios, acceptance criteria). A plan describes *how* it will be built (technical approach, constraints, implementation steps). Keep them in separate files — no implementation detail in the spec.

**Lives in:** `docs/specs/{feature-name}/`

## Layer 5 — Coding Guidelines

[[Coding-Guidelines|Prescriptive docs]] that define exactly how code must be structured, named, and organised. Referenced in code reviews as the authority. More specific than architecture docs — they answer "how exactly should I write this handler?"

**Lives in:** `docs/guidelines/`

## Supporting Documents

**Investigation docs** ([[Investigation-Docs]]) sit outside the main hierarchy. They capture research done to support a decision but are not the decision itself. They live alongside their related ADR or feature spec.

**A constitution or project principles document** anchors all layers: it states the non-negotiable technical rules (e.g. "never mock the database", "all cross-module communication via integration events") that all other documents must respect.

## Keeping It Maintained

- Each layer has a clear owner: architecture docs owned by the whole team, ADRs by the person who made the decision, module docs by the module team
- Guidelines and ADRs are referenced from code review — if a reviewer cites a guideline, the guideline must exist
- Specs are living during a feature build, then archived (`final-result.md`)
- The hierarchy itself is documented — new team members can find where to look in under 5 minutes

## Related

- [[ADRs]] — decision records in depth
- [[arc42]] — architecture documentation framework
- [[Coding-Guidelines]] — prescriptive convention documents
- [[Investigation-Docs]] — research and POC documentation
