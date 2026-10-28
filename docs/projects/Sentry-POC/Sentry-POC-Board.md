---
type: Board
title: Sentry POC — Board
description: "Status of the Sentry POC: implemented, active, planned and archived work"
tags: [sentry-poc, board, kanban, status]
status: stable
confidence: high
source: [https://github.com/radekwojpl2/dotnet-nextjs-sentry-poc, https://github.com/radekwojpl2/LinkStack]
updated: 2026-10-28
---

# Sentry POC — Board

Snapshot from 2026-10-28. The repo was last pushed on 2026-04-22 and has no open issues or PRs. The POC is complete.

## Active

- Nothing in progress.

## Planned

- Nothing recorded. LinkStack has Sentry wired in but disabled (empty DSN). Enabling it would start from this POC (see [[LinkStack-Board]]).

## Implemented

- Sentry for the .NET 8 API and the Next.js 16 frontend: errors, traces, structured logs, breadcrumbs, custom metrics ([[Sentry-Integration]])
- Distributed tracing across both services, plus server actions ([[Sentry-Integration]])
- Deployment on DigitalOcean App Platform ([[Sentry-POC-Architecture]])

## Archived

- Nothing.
