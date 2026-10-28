---
type: Board
title: Blue-Green Deployment POC — Board
description: "Status of the blue-green POC: implemented, active, planned and archived work"
tags: [blue-green-deployment, board, kanban, status]
---

# Blue-Green Deployment POC — Board

Snapshot from 2026-10-28. The repo was last pushed on 2026-05-14 and has no open issues or PRs. The POC is complete.

## Active

- Nothing in progress.

## Planned

- Nothing recorded. The open follow-up is reuse: LinkStack PR #40 (Azure Container Apps deploy) can draw on this POC.

## Implemented

- Blue-green slot switching with labeled revisions and traffic weights ([[Blue-Green-Deployment-Architecture]])
- Expand/contract migrations on a shared PostgreSQL ([[Blue-Green-Deployment-Expand-Contract]])
- Claude-based migration safety gate in CI ([[AI-Migration-Review]])
- Build, Deploy, Provision and Teardown workflows with OIDC auth ([[Pipelines]])
- Generic patterns extracted: [[Blue-Green-Deployment]], [[Expand-Contract]], [[AI-CI-Gate]]

## Archived

- Nothing.
