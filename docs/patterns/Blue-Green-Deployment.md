---
type: Pattern
tags: [pattern, deployment, blue-green, zero-downtime, infrastructure]
---

# Blue-Green Deployment

## What It Is

A deployment strategy where two identical production environments ("blue" and "green") exist simultaneously. Only one receives live traffic at a time. A new version is deployed to the idle environment, validated, then traffic is switched over — making the deploy instantaneous from the user's perspective and trivially rollbackable.

## When to Use

- Applications where downtime during deployment is unacceptable
- Teams that need a fast, reliable rollback path (switch traffic back in seconds)
- Stateless or carefully schema-managed services where both versions can safely share a database
- When smoke testing against a real production environment before going live matters

## When NOT to Use

- Applications with significant per-environment cost where running two stacks is prohibitive
- Services with strict stateful constraints that can't tolerate two versions being live simultaneously (e.g., message consumers that would double-process)
- Simple apps with low traffic where a brief restart is acceptable

## Core Concepts

**Two environments, one live:** Blue and green are mirrors. At any point one is active (serving 100% traffic), one is idle (last known-good version or pre-release).

**Deploy to idle, test, then switch:** The new version lands on the idle environment. A smoke test runs against it directly (bypassing the load balancer). Traffic switches only after the test passes.

**Instant rollback:** If anything goes wrong after cutover, switch traffic back to the previously idle environment — the old version is still running and warmed up.

**Shared database:** Both environments typically point at the same database. This is the main constraint: schema changes must be backward compatible with the version still running. See [[Expand-Contract]].

## Deployment Sequence

```
Old (blue)  ── 100% traffic ──────────────────────────────────▶ 0%
                                                                  ↑
New (green)           deployed at 0% ── smoke test ── cutover ──▶ 100%

Rollback:   Old (blue)  ◀── traffic restored if cutover fails ──────
```

## Smoke Testing

The idle environment must be reachable directly, outside the load balancer, before traffic switches. Common approach: a health endpoint that checks critical dependencies (database, downstream services). Test against the environment-specific URL, not the public one.

## Rollback

Because the old environment stays running throughout, rollback is a traffic weight change — not a redeployment. This is what separates blue-green from other zero-downtime strategies: the rollback is seconds, not minutes.

## Trade-offs

| | |
|---|---|
| **Pro** | Near-instant cutover and rollback |
| **Pro** | New version tested against real infrastructure before it receives user traffic |
| **Pro** | Old version stays warm — no cold start on rollback |
| **Con** | Running two environments doubles infrastructure cost during the deploy window |
| **Con** | Shared database requires careful schema management ([[Expand-Contract]]) |
| **Con** | Stateful workloads (sessions, in-flight requests) need handling at cutover |

## Real-World Example

- [[projects/Blue-Green-Deployment/Blue-Green-Deployment]] — Azure Container Apps implementation using labeled revisions, label-based traffic weights, and revision-specific smoke test URLs
