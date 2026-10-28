---
type: Guide
title: Spec-Driven Development (SDD) with SpecKit
description: "SDD methodology and the SpecKit command workflow, step by step"
tags: [speckit, sdd, spec-driven-development, workflow, ai]
status: draft
confidence: medium
source: [author, https://github.com/github/spec-kit]
updated: 2026-10-28
---

# Spec-Driven Development (SDD)

A methodology where you define what you want to build before writing any code.
Instead of jumping straight into implementation, you write a spec, refine it, and plan from it.
The AI implements the solution from clear requirements rather than ad-hoc prompts.

## SpecKit

GitHub's open-source toolkit that puts SDD into practice.

## Workflow

1. **Constitution** — `/speckit-constitution`
	- **CLAUDE.md** is the general "here is everything you need to know" file
	- **The constitution** is a governing document that enforces the project's non-negotiable principles
	- It applies within the structured workflow: spec → plan → build
	- Example: `/speckit-constitution Add reference that all knowledge should be first read from mind vault project, later from source and at last from internal docs module in this project. Mind vault can be found here D:\git\mind-vault`
2. **Specify** — `/speckit-specify`: spec file for 005 and requirements file
3. **Clarify** — `/speckit-clarify`: demo on 007 (see [[url-shortener-custom-domains]])
4. **Plan** — `/speckit-plan`: `contracts`, `data-model`, `research` and `plan.md` files
5. **Implement** — `/speckit-implement`
6. **Custom commands** — see the [spec-kit-custom-rbajor](spec-kit-custom-rbajor/README.md) extension
