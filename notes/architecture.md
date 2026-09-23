# Architecture

## Target (after Phase 4)

```
Browser
  |
  | HTTPS (managed cert, edge CDN)
  v
Firebase Hosting (GCP edge) -------- serves index.html / styles.css / counter.js
  |
  | fetch GET /api/visitors (CORS)
  v
Cloud Run (Rust/axum, distroless image, min 0 instances)
  |
  | atomic increment transaction
  v
Firestore (Datastore mode): counter/visitors { value: N }

CI/CD: GitHub Actions --(Workload Identity Federation, keyless)--> GCP
IaC:   Terraform, local state now -> GCS remote state in Phase 4
```

## Current (end of Phase 3) — target architecture is LIVE except CI/CD

```
Browser -> theozdev.com (Cloudflare DNS, grey-cloud, A -> 199.36.158.100)
        -> Firebase Hosting edge (Google-managed SSL cert)
        -> static files from frontend/
            |
            | counter.js: GET https://resume-api-ykjegodhwq-uc.a.run.app/api/visitors
            | (CORS allowlist: theozdev.com, www, web.app, firebaseapp.com)
            v
        Cloud Run (Rust/axum, distroless 9MB, min 0, cpu_idle, 512Mi,
                   SA=resume-api with roles/datastore.user only)
            |
            | Datastore REST v1: beginTransaction -> lookup -> commit (upsert)
            v
        Firestore (Datastore mode, us-central1): counter/visitors {value}
```

Verified end-to-end 2026-09-21: counter increments on theozdev.com; CORS
header echoes only for allowlisted origins. Budget guardrail $5 AUD active.

## Current (end of Phase 6) — COMPLETE

Everything above plus:
- CI/CD: GitHub Actions (frontend.yml, backend.yml) authenticate via WIF —
  no stored secrets. Backend pipeline is test-gated (cargo test) and
  deploys digest-pinned Cloud Run revisions via terraform apply.
- Terraform state: remote, versioned GCS bucket; shared by local + CI.
- Tests: 8 unit tests (mock CounterStore + classify mapping); local
  integration via docker-compose + Datastore emulator (no creds).
- Docs: root README.md with data-flow diagram; this notes/ directory;
  design-system/theozdev/MASTER.md governs UI changes.

Target architecture reached. Nothing from the original 6-phase plan is
outstanding.

## Cost model

| Component | Cost |
|---|---|
| Firebase Hosting | $0 (Spark: 10 GB stored, 360 MB/day egress) |
| Cloud Run | $0 at rest (min instances 0, scale-to-zero) |
| Firestore | $0 within free tier (1 GiB, 50k reads/day) |
| Cloudflare DNS | $0 |
| Rejected: Global HTTPS LB | ~$18/mo fixed — rejected, see decisions.md |

Total steady-state: ~$0/month.

## Layout

```
Cloud_Resume_Challenge/
  frontend/    index.html, styles.css, counter.js
  terraform/   main.tf, variables.tf, outputs.tf, terraform.tfvars
  firebase.json      hosting config (public dir = frontend/)
  .firebaserc        default project binding
  notes/       this directory
```
