# Phase 4: Zero-Trust CI/CD (WIF + GitHub Actions + Remote State)

Status: COMPLETE. Both pipelines green; every push to main deploys keylessly.

## What exists

- `terraform/state.tf` — GCS state bucket (versioned, public access
  enforced-blocked). State migrated from local via `terraform init
  -migrate-state` (needs interactive "yes"; `-input=false` fails).
- `terraform/wif.tf`:
  - `google_iam_workload_identity_pool.github` + provider (OIDC issuer
    token.actions.githubusercontent.com)
  - `attribute_condition = "assertion.repository ==
    'hxrsh159/cloud-resume-challenge'"` — only this repo can exchange tokens
  - `google_service_account.ci` (github-ci) — CI identity, separate from
    runtime SA
  - Project roles for CI: run.admin, artifactregistry.admin, firebase.admin,
    datastore.owner, iam.workloadIdentityPoolAdmin, iam.serviceAccountAdmin,
    serviceusage.serviceUsageAdmin (deliberately NOT roles/editor)
  - `iam.serviceAccountUser` on the runtime SA (deploys attach it)
  - `storage.admin` scoped to the state bucket only
- `.github/workflows/frontend.yml` — auth@v2 -> firebase deploy. Paths:
  frontend/**, firebase.json, .firebaserc.
- `.github/workflows/backend.yml` — auth@v2 (token_format: access_token) ->
  docker login via oauth2accesstoken -> build/push -> resolve digest ->
  terraform apply -var image_digest=<digest>. Paths: backend/**, terraform/**.
  cargo test gate added in Phase 5.
- Repo variables set via `gh variable set` (raw REST PUT 404s with our
  token; the CLI subcommand works).

## Mechanics worth remembering

- google-github-actions/auth@v2 exports GOOGLE_APPLICATION_CREDENTIALS for
  later steps; firebase-tools and terraform both consume it natively.
- permissions block needs `id-token: write` or OIDC minting fails.
- Workflow-file-only changes do not trigger either pipeline (paths
  filters); use `gh workflow run <file>` to dispatch.
- Runner warnings seen: Node 20 actions forced onto Node 24; ubuntu-latest
  migrating to Ubuntu 26 (Oct 2026). Cosmetic.

## Verification evidence

- Push of the Phase 4 commit itself triggered backend.yml: WIF auth, image
  build/push, terraform apply — success on first run.
- frontend.yml dispatched manually — success.
- Live post-pipeline: site 200, API counter incrementing.
