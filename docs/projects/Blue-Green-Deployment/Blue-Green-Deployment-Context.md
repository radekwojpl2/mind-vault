---
type: Context
title: Blue-Green Deployment POC — Project Context
description: "Big picture for the blue-green POC: why it exists, what it proves, where the code lives"
tags: [blue-green-deployment, context, overview, poc]
status: stable
confidence: medium
source: [https://github.com/radekwojpl2/blue-green-deployment-poc, https://github.com/radekwojpl2/LinkStack]
updated: 2026-10-28
---

# Blue-Green Deployment POC — Project Context

## Purpose

A proof of concept, not a product. It answers one question: *can a .NET 8 API on Azure Container Apps be deployed with zero downtime while both slots share one PostgreSQL database?* The app itself is deliberately tiny (health, info and a `DeploymentLog` table) so the deployment mechanics stay in focus.

## What It Proves

| Concern | Answer | Note |
|---|---|---|
| Traffic switching | Labeled revisions + traffic weights on Container Apps | [[Blue-Green-Deployment-Architecture]] |
| Shared-DB schema changes | Expand/contract migrations so old and new slots both work | [[Blue-Green-Deployment-Expand-Contract]] |
| Preventing unsafe migrations | Claude API reviews migrations in CI and blocks destructive ones | [[AI-Migration-Review]] |
| Pipeline | Build → migrate → deploy → smoke test → cutover; manual provision/teardown | [[Pipelines]] |
| Credentials | GitHub Actions OIDC to Azure, no stored secrets | [[Pipelines]] |

## Where the Code Lives

- GitHub `radekwojpl2/blue-green-deployment-poc`, branch `main`; local `D:\git\blue-green-deployment-poc`.
- Infrastructure is Bicep (`infra/main.bicep`); the AI reviewer is `scripts/check-migrations.sh`.

## Reading Order

1. [[Blue-Green-Deployment-Architecture]]
2. [[Pipelines]]
3. [[Blue-Green-Deployment-Expand-Contract]] and [[AI-Migration-Review]]
4. Generic versions: [[Blue-Green-Deployment]], [[Expand-Contract]], [[AI-CI-Gate]]

## Relationship to Other Projects

- The generic patterns extracted from it ([[Blue-Green-Deployment]], [[Expand-Contract]], [[AI-CI-Gate]]) are the reusable output.
- LinkStack's open PR #40 deploys to Azure Container Apps too, so this POC is the reference for that work.
