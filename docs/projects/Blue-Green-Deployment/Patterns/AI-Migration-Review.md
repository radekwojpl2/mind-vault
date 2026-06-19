---
type: Pattern
tags: [blue-green-deployment, pattern, ai, claude, migrations, ci-cd, github-actions]
---

# AI Migration Review

## What It Is

A CI gate (`scripts/check-migrations.sh`) that sends new EF Core migration files to the Claude API and blocks the build if the migration is unsafe for a blue-green deployment. Runs before tests on every push.

## How It Works

1. Detects new or changed migration `.cs` files (excludes `.Designer.cs` and `ModelSnapshot.cs`)
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
- Required output format: `RESULT: SAFE|WARNING|UNSAFE` followed by `Issues:` and `Fixes:` sections

```bash
RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: prompt-caching-2024-07-31" \
  -d "{
    \"model\": \"claude-opus-4-5\",
    \"system\": [{\"type\": \"text\", \"text\": \"$SYSTEM_PROMPT\", \"cache_control\": {\"type\": \"ephemeral\"}}],
    \"messages\": [{\"role\": \"user\", \"content\": \"$USER_MESSAGE\"}]
  }")
```

## Output Handling

```bash
RESULT=$(echo "$RESPONSE" | grep -o 'RESULT: [A-Z]*' | head -1 | cut -d' ' -f2)

case "$RESULT" in
  SAFE)    echo "Migration review passed"; exit 0 ;;
  WARNING) echo "WARNING: $RESPONSE"; exit 0 ;;   # passes CI, flagged in log
  UNSAFE)  echo "UNSAFE: $RESPONSE"; exit 1 ;;    # blocks CI
  *)       echo "Review failed — unexpected response"; exit 1 ;;
esac
```

## Trade-offs

| Aspect | Detail |
|---|---|
| Cost | Prompt caching keeps repeated builds cheap; only the migration diff is re-sent |
| Reliability | API failure fails the build explicitly — no silent skip on error |
| False negatives | LLM-based review; complex interactions between migrations could be missed |
| Fork PRs | Skips when `ANTHROPIC_API_KEY` is absent — reviewer only runs on trusted branches |

## Related

- [[Blue-Green-Deployment/Patterns/Expand-Contract]] — the rules this reviewer enforces
- [[Blue-Green-Deployment/Architecture]] — where this gate sits in the pipeline
