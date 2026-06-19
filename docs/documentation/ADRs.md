---
type: Guide
tags: [documentation, adr, architecture, decisions]
---

# Architecture Decision Records (ADRs)

## What They Are

An ADR is a short document that captures a significant architectural decision: the context that made a decision necessary, the options that were considered, what was chosen, and why. ADRs are permanent — once written they are never deleted, only superseded.

They answer the most common question a developer asks months later: *"Why is it done this way?"*

## When to Write One

Write an ADR when:
- You're choosing between two or more meaningful technical approaches
- The decision will be hard to reverse
- Future developers might reasonably question the choice
- You're deviating from an industry default or common pattern

Don't write one for implementation details — which variable name, which helper method. ADRs are for architectural choices: frameworks, patterns, service boundaries, data strategies.

**Examples that warrant an ADR:**
- Choosing Auth0 over custom JWT
- Adopting the transactional outbox pattern
- Splitting Commands and Queries into separate projects
- Using schema-per-module over database-per-module

## MADR Format

Use the MADR (Markdown Architectural Decision Records) template:

```markdown
---
status: accepted          # proposed | accepted | deprecated | superseded-by ADR-XXX
date: 2026-05-08
tags: [adr, authentication]
---

# ADR-013 — Use Auth0 as Identity Provider

## Context

We need authentication and authorisation for a B2B SaaS product. We need
JWT issuance, organisation management, and user provisioning. Building
this in-house is significant undifferentiated work.

## Considered Options

1. **Auth0** — managed identity platform
2. **Custom JWT + ASP.NET Core Identity** — in-house implementation
3. **Keycloak** — self-hosted open-source IAM

## Decision

Use **Auth0**.

Custom JWT requires building token rotation, MFA, and org management from scratch.
Keycloak requires self-hosting and operational overhead. Auth0 solves all requirements
out of the box with a generous free tier.

## Consequences

✅ MFA, SSO, and org management without in-house implementation  
✅ Auth0 webhooks handle user provisioning automatically  
❌ Vendor lock-in — migrating away later would require re-implementing auth flows  
❌ Additional per-MAU cost at scale  

## Links

- Supersedes: none  
- Related: [[ADR-002-modular-monolith]], [[ARCH-08-cross-cutting-concepts]]
```

## Numbering and Filing

- Sequential numbering: `ADR-001`, `ADR-002`, ... `ADR-019`
- File name: `ADR-{NNN}-{kebab-case-title}.md`
- All ADRs in a single `docs/decisions/` folder — no subfolders
- Never delete — mark as `superseded-by: ADR-XXX` if replaced

## Status Lifecycle

```
proposed → accepted → deprecated
                   ↓
              superseded-by: ADR-XXX
```

A superseded ADR stays in the folder. The new ADR links back to the old one.

## Writing Tips

**Context is the most important section.** If the context is vague, the decision looks arbitrary. Write enough context that someone with no prior knowledge understands *why* a decision was even necessary.

**List real alternatives.** "We considered doing it differently" is not an alternative. Name the actual options, enough that a reader could evaluate them independently.

**Consequences are honest.** Include the drawbacks (❌) alongside the benefits (✅). An ADR with only upsides reads like a sales pitch, not a decision record.

**Keep it short.** 200–400 words is right. If you need more, the decision is too broad — split it.

## Linking ADRs Together

ADRs form a graph. Link related decisions at the bottom:

```markdown
## Links
- Supersedes: ADR-007 (old CQRS approach)
- Required by: ADR-015 (transactional outbox depends on MassTransit)
- Related: ADR-008 (EF Core — same infrastructure)
```

This graph makes it possible to understand the ripple effect of revisiting a decision.

## Real-World Example

- [[projects/LinkStack/Architecture]] — 19 ADRs covering modular monolith, CQRS, Auth0, MassTransit outbox, CI pipeline, and more
