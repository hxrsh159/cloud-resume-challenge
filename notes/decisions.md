# Decision Log (ADRs)

Newest last. Each entry: context, decision, why, what was rejected.

## ADR-001: GCP + Terraform + Rust + Cloud Run + Firestore + WIF

- Context: Cloud Resume Challenge, goal is enterprise-grade, interview-ready.
- Decision: fixed constraint stack (see README.md).
- Why: serverless = scale-to-zero cost; Rust = performance + safety story;
  WIF = modern keyless security posture, a strong interview differentiator.

## ADR-002: Firebase Hosting instead of GCS + Global HTTPS Load Balancer

- Context: original spec was GCS bucket + global HTTPS LB + Cloud CDN.
- Decision: Firebase Hosting (Terraform-managed) for static hosting.
- Why:
  - Global HTTPS LB has ~$18/mo fixed cost (forwarding rule), unacceptable
    for a personal project; Firebase Hosting is $0 within free tier.
  - Firebase Hosting IS Google's edge CDN with managed SSL — same
    architecture story (global CDN + managed TLS), zero fixed cost.
  - Raw GCS website endpoint was rejected too: custom domains get HTTP only
    (no TLS), and require domain-named buckets + Search Console verification.
- Rejected: GCS+LB (cost), GCS website endpoint (no HTTPS on custom domain).

## ADR-003: Bucket name need not equal domain (obsolete with ADR-002)

- Context: GCS rejects domain-named buckets unless domain is verified in
  Search Console.
- Note: only relevant to the GCS website-endpoint pattern. Behind a backend
  bucket / with Firebase, bucket/site naming is decoupled from DNS.

## ADR-004: Cloudflare DNS records set to "DNS only" (grey cloud)

- Context: Cloudflare dashboard pushes "Proxied" (orange cloud).
- Decision: A record for theozdev.com is DNS-only.
- Why:
  - Firebase provisions its managed cert by observing what answers at the
    domain; Cloudflare proxying terminates TLS at Cloudflare and breaks
    Firebase verification/renewal.
  - Firebase edge is already a global CDN with DDoS absorption; proxying
    adds a second CDN hop with no benefit.
- Rule of thumb: proxy in front of self-managed origins (VMs); DNS-only in
  front of managed serverless platforms.

## ADR-005: Domain registrar = Cloudflare

- Why: at-cost pricing, no markup; DNS zone auto-hosted on Cloudflare, no
  nameserver changes; integrates with tooling already in use.
- Rejected: Squarespace Domains (Google Domains successor), DuckDNS free
  subdomain (bad optics on a resume).

## ADR-006: Terraform local state for Phases 1-3, remote state in Phase 4

- Why: single-developer local applies are fine early; CI/CD requires shared
  state. GCS backend bucket gets created and state migrated when GitHub
  Actions pipelines are built (Phase 4).

## ADR-007: Datastore access via REST + gcp_auth, not a client crate

- Context: spec asked for the `google-cloud-datastore` crate.
- Finding: that crate no longer exists in the crates.io index; the official
  Google Rust SDK ships `google-cloud-datastore-admin-v1` (admin only, no
  data plane).
- Decision: call Datastore REST v1 directly with reqwest (rustls) + gcp_auth.
- Why: explicit transaction control (begin/lookup/commit), no tonic/prost
  gRPC stack -> smaller binary, faster builds, fewer deps. rustls+ring with
  webpki-roots compiled in means the distroless/static image needs no CA
  bundle and no OpenSSL.
- Quirk: gcp_auth's GOOGLE_APPLICATION_CREDENTIALS path expects service
  account JSON; user ADC (authorized_user) only loads from the gcloud
  well-known path. Irrelevant on Cloud Run (metadata server).

## ADR-008: Site content strategy — one real project, not a repo wall

- Context: GitHub account has 40 public repos, mostly course/tutorial forks.
- Decision: featured-project section spotlights ONLY cloud-resume-challenge
  (this site) with honest technical detail; other repos referenced only as
  "40 public repos since 2015".
- Why: one strong original project outweighs many forks for recruiters;
  avoids overstating tutorial work.
- Content rules: plain language, no fluff, facts match Resume.odt exactly
  (roles, dates, overlap between onQ Digital and Endeavour Group is as
  written in the resume — do not editorialize).

## ADR-009: Digest-pinned Cloud Run deploys (never :latest)

- Context: after pushing a new image over :latest, `terraform apply` created
  no new revision — Cloud Run diffs the template STRING, not the digest
  behind the tag.
- Decision: `image_digest` variable; CI passes `-var image_digest=sha256:...`.
- Why: immutable deploys, exact rollback via terraform, revision history
  matches code history.

## ADR-010: cpu_idle = true + 512 Mi on Cloud Run

- Context: 256 Mi rejected — GCP requires >=512 Mi when CPU is
  always-allocated.
- Decision: request-based CPU (cpu_idle=true) + 512 Mi.
- Why: request-based billing is the scale-to-zero $0-at-rest contract;
  a 9 MB static Rust binary idles far under 512 Mi.

## ADR-011: Health endpoint is /health, not /healthz

- Finding: Google's front end reserves /healthz and answers it before the
  container (proven: GFE 404 page = 1568 B vs axum 404 = 0 B).
- Rule: never use /healthz (or /_ah/*) as app routes on GCP serverless.

## ADR-012: Public API endpoint, CORS as the browser gate

- Decision: run.invoker = allUsers; CORS allowlist (theozdev.com, www,
  web.app, firebaseapp.com) gates browser use.
- Why: a public counter API is the point of the project; CORS stops casual
  cross-site browser embedding while curl/Postman access is acceptable.
  Rate abuse risk is capped by max_instance_count=3 + budget alert.

## ADR-013: Billing via REST, guardrail budget day one

- Free-trial billing accounts cannot reopen; new pay-as-you-go account
  ("Admin", AUD) created in console, linked to project via REST PUT.
- $5 AUD budget "resume-site-guardrail" with 50/90/100% email alerts —
  billingbudgets API (note: needs x-goog-user-project header with ADC).
