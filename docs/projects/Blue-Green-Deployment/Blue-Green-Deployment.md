---
tags: [blue-green-deployment, index, dotnet, azure, postgresql, github-actions, ai]
---

# Blue-Green Deployment POC

A **.NET 8 Minimal API** proof-of-concept for zero-downtime deployments on **Azure Container Apps** with safe PostgreSQL schema evolution enforced by AI migration review.

**Stack:** ASP.NET Core 8 · PostgreSQL 15 · EF Core · Azure Container Apps · Bicep · GitHub Actions · Claude AI

**Repo:** `D:\git\blue-green-deployment-poc`

## What It Demonstrates

- Blue-green slot switching on Azure Container Apps using labeled revisions and traffic weights
- Expand/contract migration pattern to safely evolve the DB schema while both slots share one database
- AI-powered migration safety gate (Claude API) that blocks unsafe operations before merge
- Fully declarative Azure infrastructure via Bicep, provisioned from a manual GitHub Actions workflow
- OIDC-based GitHub Actions auth — no long-lived Azure credentials stored as secrets

## Project Structure

```
blue-green-deployment-poc/
├── blue-green-deployment-poc/   .NET 8 application
│   ├── Data/                    EF Core DbContext + DeploymentLog entity
│   ├── Endpoints/               Minimal API handlers (health, info, deployments)
│   └── Migrations/              EF Core migration history
├── infra/
│   └── main.bicep               All Azure resources (ACR, PostgreSQL, Container Apps)
├── scripts/
│   └── check-migrations.sh      AI migration reviewer (calls Claude API)
└── .github/workflows/
    ├── build.yml                CI: build + AI review + tests
    ├── deploy.yml               CD: image build → migrate → deploy → smoke test → cutover
    ├── provision.yml            Manual: create all Azure infrastructure
    └── teardown.yml             Manual: delete entire resource group
```

## Key Patterns

- [[Blue-Green-Deployment/Patterns/Expand-Contract]] — safe schema evolution across two live slots
- [[Blue-Green-Deployment/Patterns/AI-Migration-Review]] — Claude blocks unsafe migrations in CI

## Related Generic Patterns

- [[patterns/Expand-Contract]] (if documented)

## Sections

- [[Blue-Green-Deployment/Architecture]] — Azure infrastructure, slot switching mechanics
- [[Blue-Green-Deployment/Pipelines]] — all four workflows in detail (Build, Deploy, Provision, Teardown)
