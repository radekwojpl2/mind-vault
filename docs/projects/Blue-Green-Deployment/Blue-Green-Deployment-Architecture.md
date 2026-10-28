---
type: Architecture
tags: [blue-green-deployment, architecture, azure, container-apps, github-actions, bicep]
status: stable
confidence: medium
source: [https://github.com/radekwojpl2/blue-green-deployment-poc]
updated: 2026-10-28
---

# Architecture

## Infrastructure

All Azure resources are defined in a single Bicep file (`infra/main.bicep`) and provisioned via a manual GitHub Actions workflow. The stack:

| Resource | SKU / Config | Notes |
|---|---|---|
| Container Apps Environment | Managed + Log Analytics | `activeRevisionsMode: Multiple` required |
| Container App | External ingress, port 8080 | Hosts both blue and green revisions |
| Container Registry (ACR) | Basic, admin enabled | Images tagged by git SHA |
| PostgreSQL Flexible Server | Standard_B1ms, v15, 32GB | Single DB shared by both slots |
| Log Analytics Workspace | 30-day retention | Container App log sink |

OIDC federated credentials on a service principal grant GitHub Actions access — no stored secrets.

## Deployment Pipeline

### Phase 1 — Build (`build.yml`)
Runs on every push and PR:
1. Restore + build (.NET 8 Release)
2. AI migration review (`scripts/check-migrations.sh`) — blocks on UNSAFE, warns on WARNING
3. Unit/integration tests

### Phase 2 — Deploy (`deploy.yml`)
Triggers after Build succeeds on `main`:

```
1. Build & push container image to ACR          (tagged with git SHA)
2. Run EF Core migrations against live DB       (old slot still serving traffic)
3. Determine inactive slot                       (blue ↔ green toggle via traffic weights)
4. Deploy new image to inactive slot             (0% traffic, new revision created)
5. Wait for revision to reach Running state      (up to 120s)
6. Smoke test inactive slot via revision URL     (10 attempts, 10s backoff)
7. Cut traffic 100% to new slot                  (old slot drops to 0%)
8. On failure → deactivate new revision          (rollback, old slot keeps traffic)
```

### Slot Detection

The pipeline reads live traffic weights to decide which slot is inactive:

```bash
ACTIVE_SLOT=$(az containerapp ingress traffic show --name $CONTAINER_APP_NAME ... \
  --query "[?weight > \`0\` && label != null].label | [0]" -o tsv)
# ACTIVE_SLOT = blue  → target green
# ACTIVE_SLOT = green → target blue
# empty (first deploy) → target blue
```

Full step-by-step in [[Pipelines]] (Deploy workflow).

### Smoke Test URL

Container Apps exposes each revision at a stable URL regardless of traffic weights:

```
https://<revision-name>.<env-domain>/health
```

The `/health` endpoint returns 200 only if the database connection succeeds — tests the full stack before cutover.

### Traffic Cutover

Label-based weight assignment — no revision IDs needed:

```bash
az containerapp ingress traffic set \
  --label-weight "$TARGET=100" "$SOURCE=0"
```

`--revision-suffix <slot>-<sha>` only gives the revision a deterministic *name*. The `blue`/`green` **labels** that drive traffic are moved explicitly with `az containerapp revision label remove/add` before the weights are set.

## Application Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | DB connectivity check; 503 if unreachable |
| `GET /info` | Returns `APP_VERSION` (git SHA) and `APP_SLOT` (blue/green) |
| `GET /deployments` | Lists DeploymentLog records |
| `POST /deployments` | Appends a deployment event |
| `GET /weatherforecast` | Sample endpoint |

## Related

- [[Blue-Green-Deployment.index]]
- [[Blue-Green-Deployment-Expand-Contract]]
- [[AI-Migration-Review]]
