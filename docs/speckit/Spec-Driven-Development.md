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

Metodologia, w której definiujesz co chcesz zbudować zanim napiszesz jakikolwiek kod.
Zamiast od razu przechodzić do implementacji — piszesz spec, dopracowujesz go i planujesz na jego podstawie.
AI implementuje rozwiązanie w oparciu o jasne wymagania, a nie przypadkowe prompty.

## SpecKit

Open-source'owy toolkit GitHuba, który implementuje SDD w praktyce.

## Workflow

1. **Constitution** — `/speckit-constitution`
	- **CLAUDE.md** to ogólny plik „tu jest wszystko, co musisz wiedzieć"
	- **Konstytucja** to dokument zarządczy, który egzekwuje niezmienne zasady projektu
	- Obowiązuje w ustrukturyzowanym przepływie pracy: spec → plan → budowa
	- Example: `/speckit-constitution Add reference that all knowledge should be first read from mind vault project, later from source and at last from internal docs module in this project. Mind vault can be found here D:\git\mind-vault`
2. **Specify** — `/speckit-specify`: spec file for 005 and requirements file
3. **Clarify** — `/speckit-clarify`: demo on 007 (see [[url-shortener-custom-domains]])
4. **Plan** — `/speckit-plan`: `contracts`, `data-model`, `research` and `plan.md` files
5. **Implement** — `/speckit-implement`
6. **Custom commands** — see the [spec-kit-custom-rbajor](spec-kit-custom-rbajor/README.md) extension
