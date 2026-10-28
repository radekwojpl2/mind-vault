---
type: Pattern
tags: [blue-green-deployment, pattern, ai, claude, migrations, ci-cd, github-actions]
status: stable
confidence: high
source: [https://github.com/radekwojpl2/blue-green-deployment-poc]
updated: 2026-10-28
---

# AI Migration Review

## What It Is

A CI gate (`scripts/check-migrations.sh`) that sends new EF Core migration files to the Claude API and blocks the build if the migration is unsafe for a blue-green deployment. Runs in the Build workflow before `dotnet test`, on every push and PR.

## How It Works

1. Detects new or changed migration `.cs` files (excludes `.Designer.cs` and `ModelSnapshot.cs`). It diffs against `origin/<base>` on a PR, but only against `HEAD~1` on a push, so **a push with several commits only reviews migrations in the last commit**. Keep one migration per commit, or go through a PR.
2. Reads the full migration history for context
3. Calls the Claude API with a system prompt describing blue-green constraints and a user message containing all migration files
4. Parses the response for `RESULT: SAFE | WARNING | UNSAFE`
5. Exits non-zero on UNSAFE (blocks CI); prints issues and suggested fixes
6. Skips silently if `ANTHROPIC_API_KEY` is not set (fork PRs without secrets access)

## Prompt Design

The system prompt (~950 tokens) is cached using the Claude API's prompt caching feature, which reduces cost on repeated runs. It covers:

- Why a blue-green deployment requires schema backward compatibility
- Absolute UNSAFE operations (RenameColumn, AddColumn NOT NULL, AlterColumn incompatible type, AddUniqueConstraint, DropTable/DropColumn without prior replacement)
- Conditional rules (CREATE INDEX without CONCURRENTLY)
- Required output format: `RESULT: SAFE | WARNING | UNSAFE`, then `ISSUES:` and `FIX:` sections (exact casing)

The payload is built with `jq` (which handles all escaping) and sent with `curl`. A non-200 response fails the build.

```bash
PAYLOAD=$(jq -n --arg system_text "$SYSTEM_PROMPT" --arg user_text "$USER_MESSAGE" '{
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: [{type: "text", text: $system_text, cache_control: {type: "ephemeral"}}],
  messages: [{role: "user", content: $user_text}]
}')

HTTP_RESPONSE=$(curl -sf -w "\n%{http_code}" https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "anthropic-beta: prompt-caching-2024-07-31" \
  --header "content-type: application/json" \
  --data "$PAYLOAD" 2>&1 || true)
```

## Output Handling

```bash
REVIEW=$(echo "$HTTP_BODY" | jq -r '.content[0].text')

if echo "$REVIEW" | grep -q "^RESULT: UNSAFE"; then
  exit 1                                   # blocks CI
elif echo "$REVIEW" | grep -q "^RESULT: WARNING" || [ "$DELETED_WARNING" = true ]; then
  exit 0                                   # passes, flagged in log
else
  exit 0                                   # SAFE, or anything else
fi
```

- A **deleted** migration file also produces a warning ("manual review recommended"), but doesn't fail the build.
- **Fail-open on odd output:** any reply without `RESULT: UNSAFE` at the start of a line passes, including a malformed one. Only HTTP errors fail closed.

## Trade-offs

| Aspect | Detail |
|---|---|
| Cost | Prompt caching keeps repeated builds cheap; only the migration diff is re-sent |
| Reliability | An HTTP or API error fails the build. A malformed reply without `RESULT: UNSAFE` **passes** (fail-open) |
| Push gap | On a push only `HEAD~1` is diffed, so a multi-commit push can skip migrations |
| False negatives | LLM-based review; complex interactions between migrations could be missed |
| Fork PRs | Skips when `ANTHROPIC_API_KEY` is absent — reviewer only runs on trusted branches |

## Related

- [[Blue-Green-Deployment-Expand-Contract]] — the rules this reviewer enforces
- [[Blue-Green-Deployment-Architecture]] — where this gate sits in the pipeline
