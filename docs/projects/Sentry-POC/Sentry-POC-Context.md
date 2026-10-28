---
type: Context
title: Sentry POC — Project Context
description: "Big picture for the Sentry POC: why it exists, what it covers, where the code lives"
tags: [sentry-poc, context, overview, poc, observability]
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

- LinkStack added Sentry and removed it again in v1.4.0 (2026-04-22). This POC holds the working setup if it comes back — see [[LinkStack-Context]].
