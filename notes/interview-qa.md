# Interview Q&A

Prepared answers. Learn the reasoning, not the script.

## Architecture

**Q: Walk me through your architecture.**
Static frontend on Firebase Hosting (Google's global edge CDN with managed
TLS). A vanilla JS visitor counter calls a REST API on Cloud Run — a Rust
(axum) binary in a distroless container that atomically increments a counter
in Firestore (Datastore mode). All infrastructure is Terraform; CI/CD is
GitHub Actions authenticating keylessly via Workload Identity Federation.

**Q: Why Firebase Hosting instead of a GCS bucket behind a load balancer?**
Cost and fit. A global HTTPS LB costs ~$18/month fixed; Firebase Hosting
gives the same properties — global edge caching, managed SSL, custom
domains — at $0 within the free tier. I evaluated GCS+LB and the raw GCS
website endpoint (rejected: no HTTPS on custom domains). I can rebuild it
on GCS+LB in one Terraform module if traffic or requirements justified it.

**Q: Why Cloudflare for DNS but not as a proxy?**
Registrar pricing is at-cost and DNS is free. The A record is DNS-only
(grey cloud) because Firebase must observe the domain directly to provision
its managed certificate; proxying would terminate TLS at Cloudflare and
break issuance. Proxying adds value in front of self-managed origins, not
managed serverless platforms.

**Q: How does the managed SSL cert get provisioned?**
I publish an A record (traffic routing) and a TXT record (ownership proof).
Firebase's checker polls DNS, verifies ownership, then Google issues and
auto-renews a cert and terminates TLS at the edge. Until verification
completes, the edge refuses the hostname — which is why a fresh setup
appears unreachable for 15-45 minutes.

## Terraform

**Q: Why Terraform over the console / gcloud?**
Reproducibility and review. `plan` is a previewable diff; `apply` converges
infra to declared state; the config is versionable, code-reviewable, and
the same code runs locally and in CI.

**Q: Local vs remote state?**
Local state is fine for a solo developer applying from one machine. CI
requires shared, locked state — in Phase 4 state migrates to a GCS backend
so GitHub Actions and local runs share one state file.

**Q: What are the google vs google-beta providers?**
Same API surface, different release channels. Firebase Hosting resources
exist only in google-beta, so the config pins both providers and uses
beta only for the three Firebase resources.

## Security / CI-CD (preview of Phase 4)

**Q: Why Workload Identity Federation instead of service account keys?**
SA JSON keys are long-lived secrets that leak (logs, laptops, repos) and
need rotation. WIF lets GitHub Actions exchange a short-lived OIDC token
(minted by GitHub, scoped to my repo/branch) for short-lived GCP
credentials. No secret is stored anywhere; a leaked token expires in
minutes and only works from my repository.

## Frontend

**Q: Why vanilla JS instead of a framework?**
A resume page has no state-management problem to solve. Zero dependencies
means zero build step, zero supply-chain surface, instant load, and it
demonstrates fundamentals.

**Q: What happens if the counter API is down?**
The fetch is wrapped in try/catch; on failure the UI renders "unavailable"
and logs a warning. The static page is fully useful without the API —
graceful degradation by design.

## Backend (Phase 2)

**Q: How is the visitor counter atomic?**
Every increment runs in a Datastore transaction: begin, read the entity
inside the transaction, commit the new value. If two requests race,
Datastore aborts one transaction; my code classifies the conflict (HTTP 409
or ABORTED) and retries with backoff. No lost updates — that is the
difference between this and read-then-write without a transaction.

**Q: Why REST instead of a gRPC client library?**
The community datastore crate is unmaintained/removed and Google's official
Rust SDK only ships the admin surface. REST + gcp_auth gave explicit control
of the transaction flow and dropped the entire tonic/prost gRPC stack —
smaller binary, faster CI, fewer dependencies to audit.

**Q: Why is the container 9 MB and why does that matter?**
Multi-stage build: cargo-chef caches dependency compilation separately from
application code, the binary is compiled fully static against musl, and the
runtime is gcr.io/distroless/static running as nonroot — no shell, no libc,
no package manager. Attack surface is the binary itself, cold starts are
fast, and image pulls on Cloud Run are near-instant.

**Q: How does the container authenticate to GCP without keys?**
On Cloud Run, gcp_auth hits the metadata server for a token scoped to the
attached service account. No credential file exists in the image. Locally
it falls back to gcloud ADC.

## Cloud Run / deployment (Phase 3)

**Q: Why digest-pinned images instead of :latest?**
Two reasons. Reproducibility: a digest is immutable, so revision N always
runs exactly the bits I built and reviewed — rollback is a terraform apply
with the old digest. And a practical GCP gotcha: Cloud Run diffs the
template string, so re-pushing :latest and re-applying creates NO new
revision. Digest pinning fixes both.

**Q: Least privilege on the runtime service account?**
The Cloud Run service runs as a dedicated SA with exactly one role:
datastore.user. No storage, no logging admin, nothing else. If the
container is compromised, the blast radius is the counter entity.

**Q: The endpoint is public — how is that safe?**
Invoker is allUsers because a public counter is the product. Browsers are
gated by a CORS allowlist (only my origins get the ACAO header). Cost abuse
is bounded by max instances = 3 and a $5 budget with 50/90/100% alerts.
If I needed more, I'd add Cloud Armor or API keys.

**Q: Tell me about a weird platform bug you hit.**
/healthz never reached my container — Google's front end reserves that
path and answers it itself. I proved it by byte-size fingerprinting: GFE's
404 page is 1568 bytes, axum's 404 is 0 bytes. Renamed to /health.

**Q: How do you keep a side project at $0 without surprises?**
Scale-to-zero (min instances 0), request-based CPU (cpu_idle), a 9 MB
image (Artifact Registry pennies), Firestore free tier — plus a billing
budget with threshold alerts as the guardrail, because "should be free"
is not a control.

## STAR bullets (final, Phase 6 — Cloud/DevOps Engineer resume)

**Serverless platform engineering.** *Situation:* personal resume site with
a live dynamic component, no budget for always-on infrastructure.
*Task:* deliver production-grade hosting + API at ~$0/month without cutting
corners on reliability. *Action:* built a Rust (axum) counter API deployed
as a 9 MB distroless container on scale-to-zero Cloud Run, with the static
site on a global edge CDN with managed TLS — after rejecting a load-balancer
design that carried $18/month in fixed cost. *Result:* ~$0/month steady
state with atomic, transaction-safe counter writes in Firestore (Datastore
mode), verified by concurrency tests; platform absorbs traffic spikes at
zero idle cost.

**Zero-trust CI/CD.** *Situation:* typical GCP pipelines authenticate with
service-account JSON keys — long-lived secrets that leak and need rotation.
*Task:* eliminate stored credentials from the delivery pipeline entirely.
*Action:* implemented Workload Identity Federation — a repo-scoped OIDC
trust lets GitHub Actions exchange 5-minute tokens for a least-privilege CI
identity; separated CI and runtime service accounts so the runtime holds
exactly one role (datastore.user). *Result:* keyless pipelines for both
frontend and backend where failing tests, image digest pinning, and
Terraform remote state make every deploy reproducible and every revision
rollback-able — with nothing to leak or rotate.

**Infrastructure as Code with verification culture.** *Situation:* the
whole platform — CDN, database, container runtime, identity federation —
must be rebuildable and reviewable. *Task:* manage everything in Terraform
while keeping quality gates real, not aspirational. *Action:* wrote the
full stack as Terraform with a versioned remote-state backend, added
mock-based unit tests (including a 50-way concurrency proof for the counter)
and a Docker Compose + Datastore emulator stack for credential-free local
integration testing, gated CI deploys on `cargo test`. *Result:* a
commit-per-phase history where `terraform apply` reproduces the entire
platform and no code reaches production without passing tests — practices
documented as ADRs for team adoption.
