---
type: Pattern
tags: [pattern, ai, llm, ci-cd, gates, automation, claude]
---

# AI CI Gate

## What It Is

A CI pipeline step that sends artifacts (migrations, API contracts, config changes, dependency updates) to an LLM and blocks the build based on a structured verdict. The LLM acts as a rule enforcer for rules that are too contextual, combinatorial, or domain-specific to express as static analysis.

The key property: the rules live in a system prompt, not in code. Adding, changing, or removing a rule is a prompt edit — no new linter, no new tooling, no new binary.

## When to Use

- Rules require understanding context across multiple files (e.g., "is this migration safe given the last three migrations?")
- Rules are easier to express in prose than in code (e.g., "does this change violate the expand/contract pattern?")
- The rule set evolves frequently and you want to avoid maintaining custom static analysis tooling
- You want a blocking gate with human-readable explanations and suggested fixes, not just a pass/fail

## When NOT to Use

- Rules that can be expressed reliably as deterministic code — use a linter or a type checker
- Latency-sensitive pipelines where an API round-trip is unacceptable
- When the cost of a false positive (blocking a safe change) is higher than the cost of a false negative (missing an unsafe one)
- CI runs on untrusted forks that don't have API key access — add a skip condition

## Structure

**System prompt** defines the rules. Keep it focused on one domain. End with a required structured output format so the script can parse the verdict deterministically.

**User message** contains the artifacts to review — the files, diffs, or context the LLM needs to apply the rules.

**Response parsing** extracts the verdict (`SAFE / WARNING / UNSAFE`) and the explanation. Exit non-zero on `UNSAFE`.

```bash
RESULT=$(echo "$RESPONSE" | grep -o 'RESULT: [A-Z]*' | head -1 | cut -d' ' -f2)

case "$RESULT" in
  SAFE)    exit 0 ;;
  WARNING) echo "$RESPONSE"; exit 0 ;;
  UNSAFE)  echo "$RESPONSE"; exit 1 ;;
  *)       echo "Unexpected response — failing closed"; exit 1 ;;
esac
```

Fail closed on unexpected responses: if the API is unreachable or returns garbage, block the build rather than silently passing.

## Prompt Caching

If the system prompt is large and stable across runs, enable prompt caching (Claude API: `"cache_control": {"type": "ephemeral"}`). The system prompt is cached; only the artifact payload is re-sent each run. This cuts cost and latency significantly for high-frequency pipelines.

```bash
curl https://api.anthropic.com/v1/messages \
  -H "anthropic-beta: prompt-caching-2024-07-31" \
  -d '{
    "system": [{"type": "text", "text": "...", "cache_control": {"type": "ephemeral"}}],
    "messages": [{"role": "user", "content": "'"$ARTIFACTS"'"}]
  }'
```

## Output Format Contract

Define the output format explicitly in the system prompt. A parseable token on its own line is more reliable than asking for JSON.

```
Respond with:
RESULT: SAFE | WARNING | UNSAFE

Issues:
- <description>

Fixes:
- <suggested fix>
```

## Trade-offs

| | |
|---|---|
| **Pro** | Rules expressed in prose — low barrier to add or change |
| **Pro** | Explanations and suggested fixes come for free |
| **Pro** | Context-aware — can reason across multiple files and history |
| **Con** | Non-deterministic — same input can produce different verdicts |
| **Con** | False negatives are possible; not a substitute for deterministic checks where they exist |
| **Con** | API cost and latency on every CI run (mitigated by prompt caching) |
| **Con** | Requires API key management; skip logic needed for untrusted forks |

## Real-World Example

- [[projects/Blue-Green-Deployment/Patterns/AI-Migration-Review]] — Claude reviews EF Core migration files against expand/contract rules; blocks `RenameColumn`, `AddColumn NOT NULL`, and other unsafe operations before merge
