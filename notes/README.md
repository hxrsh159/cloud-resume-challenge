# Project Notes Index

Cloud Resume Challenge — serverless resume site on GCP, built in 6 phases.

## Files

| File | Contents |
|---|---|
| `architecture.md` | Target + current architecture, request flow, cost model |
| `decisions.md` | ADR log: every significant choice, why, rejected alternatives |
| `phase-1.md` | Frontend + static hosting: what exists, mechanics, status |
| `interview-qa.md` | Likely interview questions with prepared answers |
| `runbook.md` | Every command that worked, copy-paste ready |

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

- GCP project: `cloud-resume-challenge-509306`
- Domain: `theozdev.com` (Cloudflare registrar, DNS on Cloudflare)
- Firebase Hosting site: `theozdev` -> https://theozdev.web.app
- Repo root: `/home/harsh/Development/Cloud_Resume_Challenge`
