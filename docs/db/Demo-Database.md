---
type: Guide
title: Local Demo Database
description: "The local multi-tenant PostgreSQL demo: how to start it, what's in it, and what the ai_readonly user can see"
tags: [db, postgresql, docker, demo, multi-tenancy, ai-tooling]
status: stable
confidence: high
source: [environment]
updated: 2026-10-28
---

# Local Demo Database

A local PostgreSQL 16 database with a schema-per-tenant layout. It's the default target of [[DB-Query-Protocol]] (`DB:` messages).

> **Local only.** The `docker/` folder is git-ignored, so it exists only on the owner's machine (`D:\git\mind-vault\docker`). This note is the record that cloud agents can read.

## Start and Stop

```bash
cd D:\git\mind-vault\docker
docker compose up -d          # first start runs init/01–09 automatically
docker compose ps             # healthy once pg_isready passes
docker compose down           # stop (data kept in the pg_data volume)
docker compose down -v        # stop and wipe; the next start re-runs init scripts
```

| Item | Value |
|---|---|
| Image | `postgres:16-alpine` |
| Container | `pg_multitenant_demo` |
| Port | `localhost:5432` |
| Database | `demo` |
| Agent user | `ai_readonly` (connection details in `.claude/settings.local.json`; never copy passwords into notes) |

Init scripts in `docker/init/` run in order on the first start only: `01` schemas, `02`–`05` tables, `06`–`08` seed data, `09` the read-only user.

## Schemas and Tables

| Schema | Purpose | Tables |
|---|---|---|
| `public` | Platform-wide shared data | `currencies`, `countries`, `plans`, `tenants`, `users`, `audit_logs`, `feature_flags`, `tenant_feature_flags`, `notifications` |
| `tenant_alpha` | Tenant "Alpha Electronics" | 18 tables, the same in every tenant (below) |
| `tenant_beta` | Tenant "Beta Fashion" | same 18 tables |
| `reporting` | Cross-tenant aggregates | `daily_sales`, `monthly_revenue`, `product_performance`, `customer_cohorts`, `inventory_snapshots`, `payment_summary` |
| `config` | System configuration | `system_settings`, `email_templates`, `webhook_endpoints`, `integration_configs`, `rate_limits` |

The per-tenant tables are `departments`, `employees`, `categories`, `products`, `product_variants`, `product_images`, `inventory`, `customers`, `customer_addresses`, `discount_codes`, `orders`, `order_items`, `order_status_history`, `invoices`, `invoice_line_items`, `payments`, `shipments` and `reviews`.

This is **schema-per-tenant** isolation. That differs from LinkStack's row-level `TenantId` filters ([[Tenant-Isolation]]), so the demo is useful for comparing the two approaches.

## What `ai_readonly` Can Do Here

`docker/init/09_readonly_user.sql` grants more than the generic script:

- `CONNECT` on `demo`
- `USAGE` and `SELECT` on all tables and sequences in **all five schemas** (`public`, `tenant_alpha`, `tenant_beta`, `reporting`, `config`), including future ones via default privileges
- `CONNECTION LIMIT 10`; no superuser, createdb or createrole

The generic [[create_readonly_user]] / [[AI-Readonly-User]] script covers `public` only, with a connection limit of 5. When querying the demo, trust this note. When setting up a new database, use the generic script and add schemas as needed.

Writes (`INSERT`/`UPDATE`/`DELETE`/DDL) are denied. [[pg-stat-statements]] still needs a superuser.
