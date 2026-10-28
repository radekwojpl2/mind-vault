---
type: Spec-Summary
tags: [linkstack, spec-kit, links, feature]
feature: 007-url-shortener-custom-domains
status: draft
date: 2026-06-30
---

# URL Shortener with Custom Domains — Summary

**Feature**: `007-url-shortener-custom-domains`
**Status**: Draft (spec clarified, requirements checklist passing — not yet planned, tasked, or implemented)
**Module**: [[Links]] (with [[Users]] and [[Analytics]] integration)

## Goal
Give every link in the [[Links]] module a compact, stable short URL that redirects anonymous
visitors to the link's current destination, with two enhancements layered on top:
an optional memorable vanity alias, and premium-only branded custom domains
(e.g. `go.acme.com`) for serving short links.

## Scope (three prioritized user stories)
- **P1 — Default short URLs**: every link gets a unique short code on the platform default
  domain; redirects are stable across destination edits and stop on deletion.
- **P2 — Custom vanity alias**: optional user-supplied alias, validated (charset/length/reserved
  words) and unique per domain; falls back to auto-generated code.
- **P3 — Custom domains (premium)**: register a branded subdomain, prove control, serve short
  links from it; gated behind active premium entitlement.

## Key Decisions (from clarifications)
- **Domain verification + routing via a single CNAME** — one CNAME pointing the custom domain to
  a platform host both proves control and routes traffic. Consequence: **only subdomains** are
  supported; apex/root domains are out of scope.
- **HTTP 302 (temporary, non-cached) redirects** — every visit hits the server, so per-visit click
  tracking works and destination changes/deletions take effect immediately (FR-002).
- **Auto-provisioned managed TLS certificates** — platform issues/renews certs automatically once
  a domain is verified; users handle no certificates (FR-013a).
- **14-day grace period on premium lapse** — custom-domain redirects keep working for 14 days,
  then stop; default-domain short URLs always keep working (FR-015).
- **Two-tier destination denylist** — a per-user denylist plus a platform-managed global bad-URL
  list; a match on either rejects the link at create/edit (FR-018).
- **Anonymous resolution** — short-URL resolution requires no authentication (FR-019).

## Architecture Patterns (anticipated — not yet planned)
- **Modules**: primarily [[Links]] (short codes, aliases, custom domains, resolution); integrates
  with [[Users]] for premium entitlement + per-tier limits, and [[Analytics]] for click events.
- **Layers**: standard Domain → Application → Infrastructure → Web per [[LinkStack-Architecture]].
- **Interfaces**: cross-module premium/tier checks must go through `Users.Public.Client` (no direct
  module references); click/visit recorded by emitting an integration event consumed by
  [[Analytics]] via the [[Outbox|transactional outbox]].
- **Patterns in play**: [[LinkStack-Value-Objects]] (ShortCode, Alias, domain name), [[Business-Rules]]
  (alias validation, denylist checks), [[CQRS]] for create/edit, [[Tenant-Isolation]] for
  per-user ownership, [[Error-Handling]] for rejection reasons.
- **Key entities**: ShortCode/Alias, ShortLink (domain + code → target), CustomDomain (with
  verification status), Click/Visit Event, Denylist Entry (user-scoped or global).

## Integration Test Coverage
- **None yet.** No implementation exists. Per Constitution Principle V, this `new-feature` will
  require SpecFlow BDD acceptance scenarios in
  `Modules/Links/tests/LinkStack.Links.BehaviourTests/` plus integration tests
  (`LinkStack.Links.IntegrationTests/`, Testcontainers PostgreSQL) before it is considered done.
  The 16 Given/When/Then acceptance scenarios across the 3 user stories and the 8 success
  criteria (SC-001..SC-008) are the source for those tests.

## Constitution Deviations
- None identified at spec stage. The spec aligns with Principle VI (spec-first, BDD acceptance
  criteria present) and respects modular boundaries ([[Users]] entitlement via Public.Client,
  [[Analytics]] via events). Compliance to be confirmed at plan stage.

## Open Questions / Follow-ups
- **Next workflow steps**: run `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`; this
  summary should be regenerated after implementation to capture real decisions and test coverage.
- Concurrency on simultaneous identical alias requests on the same domain (per-domain uniqueness
  guarantee under race).
- Auto-generated code collision handling at scale (SC-004: zero collisions across 10M codes).
- Behavior of a previously verified custom domain that later stops pointing at the platform.
- Disposition of a user's aliases / custom-domain short links when the owning user is removed.
- Resolution behavior for short links inside groups shared with other users.
- Per-tier limits (max custom domains / aliases) enforcement — defined by [[Users]] subscription
  config.
- Operational prerequisite: provisioning the platform default short domain (out of feature scope).
