# Project Notes Index

Cloud Resume Challenge — serverless resume site on GCP, built in 6 phases.

## Files

| File | Contents |
|---|---|
| `architecture.md` | Target + current architecture, request flow, cost model |
| `decisions.md` | ADR log: every significant choice, why, rejected alternatives |
| `phase-1.md` | Frontend + static hosting |
| `phase-2.md` | Firestore + Rust backend + distroless Dockerfile |
| `phase-3.md` | Artifact Registry + Cloud Run + billing + live counter |
| `interview-qa.md` | Likely interview questions with prepared answers |
| `runbook.md` | Every command that worked, copy-paste ready |

Design system: `../design-system/theozdev/MASTER.md` — all UI changes must
follow it; deviations get recorded there as overrides.

## Maintenance rule

When the user says **"Update notes"**: update all files in this directory
with everything new since the last update — what was built, why, commands,
errors hit and their fixes, and new interview Q&A. Style: no fluff, no
emojis, no verbosity. Facts, reasons, commands.

## Constraints (fixed at project start)

- Cloud: GCP only
- IaC: Terraform (HCL)
- Backend: Rust (axum), multi-stage Docker, distroless runtime
- Compute: Cloud Run, min instances 0
- DB: Firestore in Datastore mode
- Frontend: plain HTML5/CSS3/vanilla JS
- CI/CD auth: Workload Identity Federation, no SA JSON keys

## Project facts

- Owner: Harshit Singh, Melbourne — ausharshitsingh@gmail.com
- LinkedIn: linkedin.com/in/harsh159 — GitHub: github.com/hxrsh159 (since 2015)
- GitHub repo: github.com/hxrsh159/cloud-resume-challenge (public)
- GCP project: `cloud-resume-challenge-509306`
- Domain: `theozdev.com` (Cloudflare registrar, DNS on Cloudflare) — LIVE with managed cert
- Firebase Hosting site: `theozdev` -> https://theozdev.web.app
- Firestore: (default) DB, DATASTORE_MODE, us-central1 (PERMANENT location)
- Backend image: resume-api, 9.04 MB distroless/static (podman build works)
- Artifact Registry: us-central1-docker.pkg.dev/cloud-resume-challenge-509306/resume-api
- Cloud Run: https://resume-api-ykjegodhwq-uc.a.run.app (min 0, cpu_idle, 512Mi)
- Runtime SA: resume-api@cloud-resume-challenge-509306.iam.gserviceaccount.com
  (roles/datastore.user only)
- Project number: 264595501605
- Billing: account 013928-968C06-22424A "Admin" (AUD), linked; budget
  "resume-site-guardrail" $5 AUD, alerts 50/90/100%
- Repo root: `/home/harsh/Development/Cloud_Resume_Challenge`

## Content source of truth

Resume content was extracted from `/home/harsh/Documents/Resume.odt`
(2026-09-21). If the ODT changes, re-extract and sync frontend/index.html.
Note: LinkedIn is not scrapeable (HTTP 999 authwall); ODT is the source.
