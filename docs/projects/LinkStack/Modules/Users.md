---
tags: [linkstack, module, users, auth0, subscriptions]
---

# Users Module

**Schema:** `users` | **Namespace:** `LinkStack.Users.*`

Manages people, organizations, friend relationships, subscriptions, and user settings. Also handles Auth0 lifecycle events (user provisioning, org creation).

## Projects

| Project | Layer |
|---------|-------|
| `LinkStack.Users.Domain` | Domain — entities, value objects, repository interfaces |
| `LinkStack.Users.Application` | Application — MediatR commands & queries |
| `LinkStack.Users.Infrastructure` | Infrastructure — EF Core, Auth0, repositories |
| `LinkStack.Users.Web` | Web — Minimal API endpoints |
| `LinkStack.Users.Public.Client` | Cross-module interface (`IUserPublicClient`) |
| `LinkStack.Users.IntegrationEvents` | Event contracts (`TrackUserLogin`, `TrackUserRegistered`) |

## Domain Entities

### FriendRequest
State machine: `Pending → Accepted / Rejected`. Business rules enforced at creation and state transitions:
- `CannotBeFriendsWithSelfRule`
- `UsersMustNotAlreadyBeFriendsRule`
- `FriendRequestMustNotAlreadyExistRule`
- `OnlyReceiverCanRespondRule`

### Friendship
Bidirectional friendship record created when a `FriendRequest` is accepted.

### Subscriptions (merged into Users module)
- `Tier` — subscription tier definition
- `Feature` — individual feature flag
- `TierFeature` — many-to-many join: which features a tier unlocks
- `UserSubscription` / `OrgSubscription` — active subscription for a user or organization

### UserSetting
Key/value user preferences stored per user.

## Auth0 Integration

`Auth0WebhookEndpoint.cs` handles Auth0 lifecycle events:
- `organization.created` → creates org in users schema
- `organization.member.removed` → removes membership
- `provision-user` → creates user record on first login

Claims transformation via `B2CUserProvisioningTransformation` maps Auth0 JWT claims (`sub`, `email`, `name`, `org_id`, `roles`) to standard ASP.NET Core claims.

JWT validation is configured via `Auth0:Domain` and `Auth0:Audience` config keys.

## Cross-Module Interface

Other modules that need user information use `IUserPublicClient` from `LinkStack.Users.Public.Client`. They **never** reference `Users.Domain` or `Users.Infrastructure` directly.

## Related

- [[Architecture]] — module dependency rules
- [[Tenant-Isolation]] — query filters, schema isolation
- [[Error-Handling]] — typed exceptions used in handlers
- [[Business-Rules]] — FriendRequest rule examples
