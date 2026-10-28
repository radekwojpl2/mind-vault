---
type: Context
title: Sentry POC — Project Context
description: "Big picture for the Sentry POC: why it exists, what it covers, where the code lives"
tags: [sentry-poc, context, overview, poc, observability]
status: stable
confidence: medium
source: [https://github.com/radekwojpl2/dotnet-nextjs-sentry-poc, https://github.com/radekwojpl2/LinkStack]
updated: 2026-10-28
---

# Sentry POC — Project Context

## Purpose

A proof of concept for **full-stack Sentry observability**: errors, performance traces, structured logs, breadcrumbs, custom metrics and distributed tracing across a .NET 8 API and a Next.js 16 frontend. The domain is trivial (a single `Message` entity in SQLite) on purpose.

## What It Covers

| Concern | Note |
|---|---|
| Service layout, CORS, containers, DigitalOcean App Platform deployment | [[Sentry-POC-Architecture]] |
| SDK init per runtime, distributed tracing, logs, breadcrumbs, metrics, server actions | [[Sentry-Integration]] |

## Where the Code Lives

- GitHub `radekwojpl2/dotnet-nextjs-sentry-poc`, branch `main`. Not cloned locally.
- Two services: `api/` (.NET 8, port 5000) and `web/` (Next.js App Router, port 3000), each with its own Sentry project and DSN.

## Reading Order

1. [[Sentry-POC-Architecture]]
2. [[Sentry-Integration]]

## Relationship to Other Projects

- In LinkStack, the v1.4.0 changelog lists both "add Sentry integration" and "removed sentry", but `master` (checked 2026-10-28) still references `Sentry.AspNetCore` 6.4.1 and ships an empty `Sentry:Dsn`, so Sentry is wired in but stays off until a DSN is set. To turn it on there, start from this POC — see [[LinkStack-Context]].
