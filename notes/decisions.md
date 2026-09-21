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
