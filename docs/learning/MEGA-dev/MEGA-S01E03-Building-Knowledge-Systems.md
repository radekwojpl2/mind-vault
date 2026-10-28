---
type: Lesson
title: MEGA.dev S01E03 — Building Knowledge Systems
description: "Agent-first knowledge bases: formats, retrieval, reaching context, self-management"
tags: [learning, mega-dev, knowledge-management, agents, retrieval, search]
status: stable
confidence: medium
source: [https://hq.mega.dev/lessons/s01e03/, course:MEGA.dev S01E03]
updated: 2026-10-28
---

# MEGA.dev S01E03 — Building Knowledge Systems

My summary of the lesson. It drives the refactor in mind-vault issue #1.

## Core Idea

Knowledge bases are shifting from human-first to **agent-first**. Agents increasingly read, write and maintain them, and people reach the knowledge through an agent. So the agent should build and maintain the base, raw content is for the AI, and editors like Obsidian become mainly readers.

## Formats

- Markdown and HTML dominate because text is an LLM's native medium and agents can read and write it easily.
- MDX / SVX add components (checklists, interactive explainers) while keeping the source readable.
- **Skills and artifacts** can be part of the knowledge base. A skill with templates and logic steers the model toward consistent output without boxing it in.
- Cloud tools (Notion, Google Docs) have better collaboration features but often limit agent access, for example to images.

## Retrieval

| Method | Strength | Weakness |
|---|---|---|
| **grep / ripgrep** (agentic, multi-turn) | Very effective on text and code; the agent iterates until it has enough | Useless for images and PDFs |
| **Semantic search** (embeddings) | Finds content similar in *meaning* that keyword patterns miss | Needs indexing and chunking; the embedding model has a knowledge cutoff; *similar* is not the same as *relevant* |
| **Decision models** | A fast model picks which files to open, cutting exploration cost | An extra component |
| **Hybrid** | Usually the best results: catches what each method misses | Most complex to run |

For a small personal knowledge base, advanced search isn't needed. Grep is enough.

## Reaching the Right Context

The common failure: an agent finds a few notes that *look* complete but never reaches the note with the bigger picture, so it hallucinates or implements the wrong thing. Ways to raise the odds:

- **Global context**: environment, machine, projects, tools, principles.
- **Project context**: vision, feature map, style guide, business aspects.
- **Metadata**: tags, categories, sources, trust and freshness (e.g. OKF frontmatter).
- **Broader context**: a board of implemented / active / planned / archived work, so an agent knows what came before and what's next.

## Let the Agent Shape the Structure

Don't design the folders yourself to "stay in control". Shape the environment instead. The knowledge-skill loop:

1. Define purpose
2. Build context (research known strategies)
3. Initialize structure (try alternatives)
4. Initialize templates (guidance, not rigid sections)
5. Write the skill for working with the base
6. Test with subagents against a clear "good enough" bar, then iterate

The loop can rerun as the base grows.

## Self-Management

- **Single entry point**: one inbox; agents organise from there.
- **Schedules**: periodic cleanup and sync, kept simple to avoid degrading the base.
- **Events**: merged PRs, new repos, issues, labelled email and read-later items can all trigger updates. Distil them; don't copy them.
- **Source of truth**: the base owns its own notes. External systems keep their data, and the base only knows where to find it.

## Applied in This Vault

| Lesson point | Where |
|---|---|
| Global and project context | [[Global]], [[LinkStack-Context]], [[Blue-Green-Deployment-Context]], [[Sentry-POC-Context]] |
| Boards for broader context | [[LinkStack-Board]], [[Blue-Green-Deployment-Board]], [[Sentry-POC-Board]] |
| Trust and freshness metadata | [[Vault-Profile]] |
| Purpose and "good enough" bar | [[Vault-Purpose]] |
| Structure alternatives | [[Vault-Structure]] |
| Single entry point | [[Inbox.index]] |
| Retrieval | grep plus a root [[index]] and unique note names. No semantic search for now |
