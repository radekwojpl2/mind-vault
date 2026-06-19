---
type: Guide
tags: [blue-green-deployment, pipelines, github-actions, azure, ci-cd, deploy]
---

# Pipelines

Four GitHub Actions workflows. Build and Deploy run automatically on push to `main`; Provision and Teardown are manual.

## Build (`build.yml`)

**Triggers:** every push to any branch, PRs targeting `main`

```
1. Checkout (fetch-depth: 0 — full history for migration diff)
2. Setup .NET 8
3. dotnet restore
4. dotnet build --no-restore -c Release
5. Review migrations (AI)    ← bash scripts/check-migrations.sh
6. dotnet test --no-build -c Release
```

The AI review step runs before tests — a migration blocked here never reaches the deploy pipeline. The `ANTHROPIC_API_KEY` secret is passed in; if absent (fork PRs), the script skips silently.

See [[Blue-Green-Deployment/Patterns/AI-Migration-Review]] for how the review works.

---

## Deploy (`deploy.yml`)

**Triggers:** `workflow_run` after Build succeeds on `main`, or `workflow_dispatch` (manual)

**Guard clause:** the job only runs if the triggering Build concluded with `success` — a failed build never deploys.

**Required permissions:** `id-token: write` (OIDC login to Azure), `contents: read`

### Step-by-step

#### 1. Azure login (OIDC)
```yaml
uses: azure/login@v2
with:
  client-id:       ${{ secrets.AZURE_CLIENT_ID }}
  tenant-id:       ${{ secrets.AZURE_TENANT_ID }}
  subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```
No password stored — GitHub's OIDC token is exchanged for an Azure access token via a federated credential on the service principal.

#### 2. Build and push image
```bash
az acr build \
  --registry $ACR_NAME \
  --image app:${{ github.sha }} \
  --file blue-green-deployment-poc/Dockerfile \
  .
```
`az acr build` runs the Docker build in Azure, so no local Docker daemon is needed. Image tagged with the full git SHA.

#### 3. Run database migrations
```bash
dotnet tool install --global dotnet-ef --version 8.*
dotnet ef database update \
  --project blue-green-deployment-poc/... \
  --connection "${{ secrets.POSTGRES_CONNECTION_STRING }}"
```
Migrations run **before** the new slot is created. The old slot is still serving 100% of traffic, so the schema must remain backward compatible with the running code — this is why the [[Blue-Green-Deployment/Patterns/Expand-Contract]] pattern is required.

#### 4. Determine target slot
```bash
ACTIVE_SLOT=$(az containerapp ingress traffic show \
  --query "[?weight > \`0\` && label != null].label | [0]" \
  -o tsv 2>/dev/null || echo "")

# blue active → deploy to green
# green active → deploy to blue
# nothing active (first deploy) → deploy to blue
```
Reads live traffic weights, not any stored state — avoids drift between what's deployed and what the pipeline thinks is deployed.

#### 5. Deploy new revision
```bash
az containerapp update \
  --image "$ACR_SERVER/app:${{ github.sha }}" \
  --revision-suffix "$TARGET-$SHORT_SHA" \
  --set-env-vars "APP_VERSION=${{ github.sha }}" "APP_SLOT=$TARGET"
```
`--revision-suffix` produces a deterministic revision name: `<app-name>--<slot>-<8-char-sha>`. This lets the pipeline construct the revision name directly rather than querying the API (avoids a race condition).

#### 6. Wait for Running state
```bash
for i in $(seq 1 12); do   # up to 120 seconds
  STATE=$(az containerapp revision show ... --query "properties.runningState" -o tsv)
  [ "$STATE" = "Running" ] && break
  sleep 10
done
```
Label assignment fails if the revision is still starting. Polling here prevents a flaky "label not found" error.

#### 7. Assign slot label
```bash
# Remove label from whichever revision currently holds it
az containerapp revision label remove --label $TARGET 2>/dev/null || true

# Assign to the new revision
az containerapp revision label add --label $TARGET --revision $NEW_REVISION
```
Labels (`blue`, `green`) are what drive traffic weights — they must be moved to the new revision before setting weights.

#### 8. Hold new slot at 0% traffic
```bash
az containerapp ingress traffic set \
  --label-weight "$SOURCE=100" "$TARGET=0"
```
Explicitly keeps the old slot live during smoke testing. The new revision is running and reachable, but serving no production traffic yet.

#### 9. Smoke test
```bash
# Revision-specific URL — bypasses traffic weights entirely
ENV_DOMAIN="${APP_FQDN#*.}"
SMOKE_URL="https://$NEW_REVISION.$ENV_DOMAIN/health"

for i in $(seq 1 10); do   # 10 attempts, 10s apart = up to 100s
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SMOKE_URL")
  [ "$STATUS" = "200" ] && exit 0
  sleep 10
done
exit 1
```
Uses the revision-specific subdomain (`<revision>.<env-domain>`) — this URL exists for every revision regardless of traffic assignment. The `/health` endpoint checks DB connectivity, so a passing smoke test confirms the full stack.

#### 10. Cut over traffic
```bash
# Normal deploy: swap weights between labels
az containerapp ingress traffic set \
  --label-weight "$TARGET=100" "$SOURCE=0"

# First deploy: replace latestRevision=100 with explicit label=100
# (so future deploys can use label-based switching)
az containerapp ingress traffic set \
  --label-weight "$TARGET=100"
```

#### 11. Rollback on failure (conditional step)
```bash
if: failure()
---
az containerapp revision deactivate --revision "$REVISION"
```
If **any** step after revision creation fails, the new revision is deactivated. The old slot keeps its traffic weight and continues serving. No manual intervention needed for the common failure case.

### Deploy sequence diagram

```
Old slot (blue)    ─────────────── 100% traffic ───────────────────────────▶ 0%
                                                                              ↑
Migrations run     ──────────────── schema updated ──────────────────────────│
                                                                              │
New slot (green)                   created at 0% ── smoke test ── cutover ──▶ 100%
```

---

## Provision (`provision.yml`)

**Triggers:** `workflow_dispatch` with a required `location` input (default: `northeurope`)

**What it does:**
1. Azure login (OIDC)
2. `az group create` — creates the resource group in the chosen region
3. `az deployment group create` — deploys `infra/main.bicep` with secrets passed as parameters
4. Prints the PostgreSQL FQDN so you can construct the connection string

**Required secrets:** `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `ACR_NAME`, `CONTAINER_APP_NAME`, `CONTAINER_APP_ENV_NAME`, `POSTGRES_ADMIN_PASSWORD`

After provisioning, manually copy the printed FQDN into the `POSTGRES_CONNECTION_STRING` secret — that secret is only needed for the Deploy pipeline.

The Bicep deployment is idempotent; re-running Provision on existing infrastructure updates it rather than failing.

---

## Teardown (`teardown.yml`)

**Triggers:** `workflow_dispatch` with a `confirm` input that must equal `"yes"`

```yaml
if: github.event.inputs.confirm == 'yes'
```

```bash
az group delete \
  --name ${{ secrets.AZURE_RESOURCE_GROUP }} \
  --yes \
  --no-wait
```

Deletes the entire resource group and all resources inside it. `--no-wait` means the job exits immediately; deletion continues asynchronously in Azure. Irreversible — all data including the PostgreSQL database is lost.

---

## Required GitHub Secrets

| Secret | Used by | Description |
|---|---|---|
| `AZURE_CLIENT_ID` | Deploy, Provision, Teardown | Service principal app ID (OIDC) |
| `AZURE_TENANT_ID` | Deploy, Provision, Teardown | Azure AD tenant |
| `AZURE_SUBSCRIPTION_ID` | Deploy, Provision, Teardown | Azure subscription |
| `AZURE_RESOURCE_GROUP` | Deploy, Provision, Teardown | Resource group name |
| `CONTAINER_APP_NAME` | Deploy, Provision | Container App resource name |
| `CONTAINER_APP_ENV_NAME` | Provision | Container Apps Environment name |
| `ACR_NAME` | Deploy, Provision | Azure Container Registry name |
| `POSTGRES_ADMIN_PASSWORD` | Provision | DB admin password |
| `POSTGRES_CONNECTION_STRING` | Deploy | Full EF Core connection string |
| `ANTHROPIC_API_KEY` | Build | Claude API key for migration review |

## Related

- [[Blue-Green-Deployment/Blue-Green-Deployment]]
- [[Blue-Green-Deployment/Architecture]]
- [[Blue-Green-Deployment/Patterns/Expand-Contract]]
- [[Blue-Green-Deployment/Patterns/AI-Migration-Review]]
