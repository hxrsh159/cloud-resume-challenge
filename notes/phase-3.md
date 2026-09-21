# Phase 3: Artifact Registry + Cloud Run + Live Counter

Status: COMPLETE. API live at https://resume-api-ykjegodhwq-uc.a.run.app,
counter wired into theozdev.com and verified end-to-end.

## What exists (terraform/backend.tf)

- `google_artifact_registry_repository.backend` — Docker repo `resume-api`,
  us-central1
- `google_service_account.api` — `resume-api` runtime identity
- `google_project_iam_member.api_datastore` — roles/datastore.user ONLY
- `google_cloud_run_v2_service.api` — min 0 / max 3, cpu_idle=true, 512 Mi,
  1 CPU, env GCP_PROJECT_ID, image digest-pinned via var.image_digest
- `google_cloud_run_v2_service_iam_member.public_invoker` — allUsers
  (ADR-012)
- APIs enabled: artifactregistry, run, billingbudgets

## Deploy flow (manual now, Phase 4 automates)

1. podman build (backend/) -> tag -> push to AR
2. put new digest in terraform.tfvars image_digest
3. terraform apply -> new Cloud Run revision

## Bug log (all real, all fixed)

1. Billing: free-trial account cannot reopen -> new pay-as-you-go account,
   linked via REST (ADR-013).
2. 256 Mi memory rejected (cpu always-allocated needs >=512 Mi) -> ADR-010.
3. /healthz intercepted by Google front end -> /health (ADR-011).
4. :latest push + apply = no new revision (template string unchanged) ->
   digest pinning (ADR-009).

## Verification evidence

- /health -> ok; /api/visitors increments (count 13+ at end of phase)
- curl with Origin: https://theozdev.com -> access-control-allow-origin
  echoes the origin; other origins get no CORS header
- budget resume-site-guardrail exists ($5 AUD, 50/90/100% alerts)
