---
type: Log
tags: [log, linkstack]
---

# LinkStack — Change Log

## 2026-10-28
> Vault refactor, issue #1 Phase 1

- Renamed: `Architecture` → [[LinkStack-Architecture]], `Patterns/Value-Objects` → [[LinkStack-Value-Objects]] (unique names; all links updated)
- Modified: [[url-shortener-custom-domains]] — merged the duplicate root `projects/` summary (302 redirects, test sources, ops prerequisite); listed under Specs in [[LinkStack.index]]

## 2026-06-30
- Added: [[url-shortener-custom-domains]] — short URLs with vanity aliases and premium custom domains (302 redirects, CNAME verification, auto-TLS) for the Links module

## 2026-06-19 · `8ac317f`
> Add OKF type field to all note frontmatter

- Modified: [[LinkStack-Architecture]], [[Authentication]], [[Dev-Setup]], [[LinkStack.index]]
- Modules — Modified: [[Analytics]], [[Links]], [[Users]]
- Patterns — Modified: [[Business-Rules]], [[CQRS]], [[Error-Handling]], [[Outbox]], [[Tenant-Isolation]], [[LinkStack-Value-Objects]]

## 2026-05-31 · `cff31d8`
> Initial commit: Obsidian knowledge vault with engineering patterns and project docs

- Added: [[LinkStack-Architecture]], [[Authentication]], [[Dev-Setup]], [[LinkStack.index]]
- Modules — Added: [[Analytics]], [[Links]], [[Users]]
- Patterns — Added: [[Business-Rules]], [[CQRS]], [[Error-Handling]], [[Outbox]], [[Tenant-Isolation]], [[LinkStack-Value-Objects]]
