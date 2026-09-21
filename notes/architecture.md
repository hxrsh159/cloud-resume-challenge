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

## Current (end of Phase 1)

```
Browser -> theozdev.com (Cloudflare DNS, grey-cloud, A -> 199.36.158.100)
        -> Firebase Hosting edge (Google-managed SSL cert)
        -> static files from frontend/
```

- `theozdev.web.app` works immediately after each deploy; apex domain works
  after DNS verification + cert issuance (~15-45 min total).
- Visitor counter renders "unavailable" until Phase 3 provides the API URL.

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
