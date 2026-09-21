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

## STAR bullet seeds (expand in Phase 6)

- Built zero-cost serverless resume platform on GCP (Firebase Hosting CDN,
  Cloud Run, Firestore) with 100% Terraform-managed infrastructure.
- Implemented keyless CI/CD with Workload Identity Federation, eliminating
  long-lived credentials from the pipeline.
- Engineered atomic visitor counter in Rust with distroless container
  (<10 MB image) on scale-to-zero Cloud Run.
