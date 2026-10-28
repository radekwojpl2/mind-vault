---
type: Context
title: LinkStack — Project Context
description: "Big picture for LinkStack: purpose, feature map, where the code lives, glossary, known gaps"
tags: [linkstack, context, overview, feature-map, glossary]
status: stable
confidence: medium
source: [https://github.com/radekwojpl2/LinkStack, https://github.com/radekwojpl2/dotnet-nextjs-sentry-poc]
updated: 2026-10-28
---

# LinkStack — Project Context

Read this before any module note. It gives the bigger picture the detailed notes assume.

## Purpose

LinkStack lets people and teams collect, organise and share links. Users group links, tag them (with AI-suggested tags), share groups with friends or organisations, and see activity analytics. Premium tiers unlock extra features (e.g. custom short-link domains in [[url-shortener-custom-domains]]).

It is also the primary playground for the engineering patterns in this vault: modular monolith, DDD value objects, CQRS, transactional outbox, BDD with SpecFlow, spec-driven development with SpecKit.

## Feature Map

| Area | Module | Features | Notes |
|---|---|---|---|
| Identity & social | [[Users]] | Auth0 sign-up/provisioning, people, organisations, friend requests, subscriptions/tiers, persisted user settings (jsonb) | Exposes `Users.Public.Client` to other modules |
| Links | [[Links]] | Links, groups (with colour and icon), sharing, tags, AI tag suggestions | Only module with split Read/Write application projects |
| Analytics | [[Analytics]] | Consumes link/user events; activity per link and per group; reporting endpoints | Produces no events of its own |
| Imports | — | Bulk import via MassTransit saga | Not documented yet |
| Short URLs | [[Links]] | Short codes, vanity aliases, premium custom domains | Spec only — [[url-shortener-custom-domains]] |

## Where the Code Lives

- **Backend:** GitHub `radekwojpl2/LinkStack`, branch `master`. Top level: `BuildingBlocks/`, `Extensions/`, `Libs/`, `LinkStack.Api/`, `Modules/{Users,Links,Analytics}/`, `bruno-collection/` (HTTP requests), `docker-compose.yml`. Has its own `CLAUDE.md` and SpecKit `specs/`.
- **Frontend:** GitHub `radekwojpl2/LinkStackPortal` (TypeScript) — not documented here.
- **Local:** no backend working copy; see [[Global]].
- **Releases:** semantic-release, `CHANGELOG.md` in the repo (v1.7.0 on 2026-05-17).

## Reading Order

1. [[LinkStack-Architecture]] — layers, module map, cross-module rules
2. The module note for the area in question ([[Users]], [[Links]], [[Analytics]])
3. The relevant pattern note ([[CQRS]], [[Outbox]], [[Tenant-Isolation]], [[LinkStack-Value-Objects]], [[Business-Rules]], [[Error-Handling]])
4. [[Authentication]] and [[Dev-Setup]] for security and running locally

## Glossary

- **Module** — a bounded context with its own DB schema and project set; never references another module's internals.
- **Public.Client** — the only allowed synchronous cross-module reference (e.g. `IUserPublicClient`).
- **Integration event** — async cross-module message, published through the transactional outbox ([[Outbox]]).
- **Table Module** — read-side query object in `Links.Application.Read` (see [[CQRS]]).
- **Tier / premium entitlement** — subscription level owned by [[Users]]; other modules check it via Public.Client.

## Known Gaps and Drift

- **Imports module** is undocumented.
- **Open stacked PRs (#34–#41)** in the LinkStack repo add bookmarks import/export, a .NET Aspire AppHost, Azure Container Apps deployment, and **replace Table Modules and Specifications with a Dapper read side**. Once merged, [[CQRS]] and the read-side parts of [[Links]] will be outdated.
- **Open SpecKit tasks (#11–#21)** move endpoint mapping out of each module's Infrastructure into its Web project (`<Module>WebExtensions`). [[LinkStack-Architecture]] does not reflect that yet.
- Sentry was added and then removed in v1.4.0; observability lessons live in [[Sentry-POC.index]].
