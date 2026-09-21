# Cloud Resume Challenge — theozdev.com

A fully automated, serverless resume platform on Google Cloud, built with
enterprise-grade patterns: infrastructure as code, a compiled-language
backend in a minimal container, atomic data operations, and a keyless
zero-trust CI/CD pipeline.

**Live:** https://theozdev.com · **API:** https://resume-api-ykjegodhwq-uc.a.run.app/api/visitors

## Architecture

```
                          ┌────────────────────────────────────────────┐
                          │                 GitHub                     │
                          │  push to main                              │
                          │    ├─ frontend/** ──► frontend.yml         │
                          │    └─ backend/**  ──► backend.yml          │
                          └──────────────┬─────────────────────────────┘
                                         │ OIDC token (5-min, repo-scoped claims)
                                         ▼
                          ┌────────────────────────────────────────────┐
                          │  Workload Identity Federation (GCP STS)    │
                          │  condition: repository == this repo        │
                          │  impersonates: github-ci SA (no JSON keys) │
                          └──────────────┬─────────────────────────────┘
                                         │ short-lived access token
            ┌────────────────────────────┼─────────────────────────────┐
            ▼                            ▼                             ▼
   firebase deploy              docker build/push            terraform apply
   (static assets)              (Artifact Registry)          -var image_digest=…
                                         │                             │
                                         └──────────► new revision ◄───┘
                                                        │
   ┌────────────┐   HTTPS   ┌──────────────────┐        ▼
   │  Browser   │──────────►│ Firebase Hosting │   ┌──────────────────────┐
   │            │           │ (global edge CDN,│   │ Cloud Run            │
   │            │◄──────────│  managed TLS)    │   │ resume-api           │
   └─────┬──────┘  static   └──────────────────┘   │ Rust/axum, 9 MB      │
         │                                         │ distroless, nonroot  │
         │ GET /api/visitors (CORS allowlist)      │ min 0, cpu_idle      │
         └────────────────────────────────────────►│ SA: datastore.user   │
                                                   └──────────┬───────────┘
                                                              │ REST v1
                                                              │ begin → lookup → commit
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │ Firestore (Datastore │
                                                   │ mode), us-central1   │
                                                   │ counter/visitors     │
                                                   └──────────────────────┘
```

## Design decisions

The reasoning behind every significant choice is recorded as ADRs in
[`notes/decisions.md`](notes/decisions.md). Highlights:

- **Firebase Hosting over GCS + HTTPS Load Balancer** — identical properties
  (global edge CDN, managed TLS, custom domain) at $0 vs ~$18/mo fixed for
  the load balancer. The LB variant was built first, then replaced when the
  cost model was examined (ADR-002).
- **Datastore REST API over a gRPC client crate** — the community crate is
  gone and Google's official Rust SDK ships admin-only. REST + `gcp_auth`
  drops the entire tonic/prost tree: smaller binary, faster CI (ADR-007).
- **Digest-pinned deploys** — Cloud Run diffs the template *string*;
  re-pushing `:latest` silently creates no new revision. CI resolves the
  pushed digest and passes it to Terraform (ADR-009).
- **Workload Identity Federation** — no service-account JSON key exists in
  any secret store. GitHub's OIDC token is exchanged for a repo-scoped,
  minutes-lived credential (ADR in notes, workflows in `.github/workflows/`).
- **Trait-seamed backend** — the handler depends on `CounterStore`, so unit
  tests mock storage and the compose stack swaps in the Datastore emulator
  via one env var (`DATASTORE_EMULATOR_HOST`).

## Repository layout

```
frontend/          vanilla HTML/CSS/JS (design system: design-system/theozdev/MASTER.md)
backend/           Rust (axum) visitor-counter API + distroless Dockerfile
terraform/         all GCP infrastructure (hosting, Firestore, Cloud Run, WIF, state)
.github/workflows/ frontend.yml + backend.yml (keyless, WIF)
docker-compose.yml local stack: API + Datastore emulator (no GCP creds needed)
notes/             architecture, ADRs, interview Q&A, runbook
```

## Reproduce / operate

```bash
# infrastructure
cd terraform && terraform init && terraform plan && terraform apply

# backend: unit tests (8) — mock store, no GCP needed
cd backend && cargo test

# backend: full local stack against the Datastore emulator
docker compose up --build
curl http://localhost:8081/api/visitors

# frontend deploy
npx firebase-tools deploy --only hosting --project cloud-resume-challenge-509306
```

CI/CD: push to `main` — `frontend/**` changes deploy the site,
`backend/**`/`terraform/**` changes run tests, build, push, and roll a new
Cloud Run revision. Nothing else is required; there are no secrets to rotate.

## Security posture

- No long-lived credentials anywhere (WIF; runtime uses the Cloud Run
  metadata server)
- Runtime service account holds exactly one role: `datastore.user`
- Container is `gcr.io/distroless/static` running as nonroot — no shell,
  no libc, no package manager
- CORS allowlist gates browser origins; state bucket blocks public access;
  $5 budget with 50/90/100% alerts bounds cost abuse
