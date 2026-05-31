---
tags: [sentry-poc, index, dotnet, nextjs, sentry, observability]
---

# Sentry POC

A proof-of-concept demonstrating **full-stack Sentry observability** across a .NET 8 API and a Next.js 16 frontend — covering errors, performance traces, structured logs, breadcrumbs, custom metrics, and distributed tracing.

**Stack:** ASP.NET Core 8 · SQLite (EF Core 8) · Next.js 16 · React 19 · Tailwind 4 · Sentry.AspNetCore 6 · @sentry/nextjs 10

---

## Architecture

- [[Architecture]] — service layout, CORS, containerization, deployment (DigitalOcean App Platform)

---

## Sentry Integration

- [[Sentry-Integration]] — initialization per runtime, distributed tracing, logs, breadcrumbs, metrics, server actions

---

## Pages

| Route | Component type | Purpose |
|---|---|---|
| `/` | Client component | Echo messages, error triggers, slow failure flow |
| `/server` | Server component + server actions | SSR fetch, server action error/slow triggers |
| `/swagger` (API) | — | Swagger UI for the .NET API |
