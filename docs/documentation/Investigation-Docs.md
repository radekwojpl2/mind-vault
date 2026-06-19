---
type: Guide
tags: [documentation, research, investigation, poc]
---

# Investigation Documents

## What They Are

An investigation document captures the research done to answer a specific technical question — usually before making an architectural decision or starting a non-trivial implementation. It's the written record of a POC, spike, or technology evaluation.

They sit between "we need to understand X" and "here's the ADR for what we decided about X."

## When to Write One

Write an investigation when:
- You're evaluating a technology or service you haven't used before (Auth0, Sentry, Cloudflare Workers)
- You're doing a proof of concept to validate feasibility
- The answer to a question will inform an ADR or feature plan
- The research took more than an hour and should not be lost to Slack

Don't write one for routine implementation questions. If the answer is "read the docs," link the docs.

## Template

```markdown
---
status: complete        # in-progress | complete | abandoned
tags: [investigation, auth0]
date: 2026-03-15
---

# Investigation: Auth0 for B2B SaaS

## Goal
Evaluate whether Auth0 can support our B2B requirements:
organisation management, user provisioning via webhook, and custom roles.

## Findings

### Organisation Management
Auth0 Organisations supports multi-tenant B2B natively. Each org gets
an `org_id` claim in the JWT. User membership is managed via the Auth0 API.

### User Provisioning
Auth0 Streams (webhooks) fire on `user.created`, `organization.member.added`,
and `organization.member.removed`. We can hook these to provision/deprovision
users in our database without polling.

### Custom Roles
Roles are added to the JWT via custom claims using an Auth0 Action (a small
JS function that runs post-authentication). Example:

```js
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim('https://myapp.com/roles', roles);
};
```

### Pricing
Free tier: 7,500 MAU. Paid plans start at $23/month for B2B features.
M2M tokens (used for webhook verification) cost separately.

## Gaps / Open Questions
- Webhook signature verification not documented clearly — see [[ADR-013]] for our approach
- Rate limits on Management API (user provisioning calls) — 1000 req/min on free tier

## Decision / Outcome
Proceeding with Auth0. See [[ADR-013-auth0]] for the formal decision.

## References
- Auth0 Organisations docs: https://auth0.com/docs/manage-users/organizations
- Auth0 Actions: https://auth0.com/docs/customize/actions
- Webhook verification: https://auth0.com/docs/customize/log-streams/custom-log-streams
```

## Naming and Filing

```
docs/ai-investigation/
  AI-01-auth0-poc.md
  AI-02-cloudflare-custom-domains.md
  AI-03-masstransit-outbox.md
```

Prefix with `AI-{NN}` (or `INV-{NN}`) and a descriptive slug. File alongside the related ADR or spec.

## Key Sections

**Goal** — one or two sentences. What specific question does this investigation answer? A vague goal produces a vague document.

**Findings** — the actual research. Subheadings per area evaluated. Include code samples, configuration examples, and gotchas discovered. This is the most important section — make it detailed enough that someone who didn't do the research can understand what was found.

**Gaps / Open Questions** — things still unknown after the investigation. These become inputs to the ADR or spec.

**Decision / Outcome** — what was decided as a result of this investigation. Links to the ADR where the formal decision lives.

**References** — links to external sources. Include docs, blog posts, GitHub issues — anything that was actually read.

## Writing Discipline

- Write findings during the investigation, not after. Notes taken in the moment are more accurate than recollections.
- Use subheadings per area — don't write prose that buries the key facts.
- Include negative findings: "X does not support Y" is as valuable as "X supports Z."
- Link to the ADR that used this research — without the link, the investigation is an orphan.

## Trade-offs

| Pro | Con |
|-----|-----|
| Captures knowledge that would otherwise be lost | Overhead for simple decisions |
| Supports the ADR with evidence | Can become outdated if the technology changes |
| Onboards new developers into past reasoning | Temptation to write a tutorial instead of a decision-supporting doc |

## Real-World Example

- `docs/ai-investigation/AI-01-auth0-poc.md` in LinkStack — 650-line deep-dive with TypeScript and C# samples that directly supported [[ADR-013]]
