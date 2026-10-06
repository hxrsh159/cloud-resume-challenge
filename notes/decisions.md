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

## ADR-014: CI identity separate from runtime identity

- github-ci (CI) can deploy and manage infra; resume-api (runtime) holds
  only datastore.user. Compromise of CI does not grant data-plane access at
  runtime; compromise of runtime cannot deploy.
- WIF attribute_condition pins token exchange to the exact repository —
  no other repo (even by the same owner) can impersonate the CI SA.

## ADR-015: GitHub profile cleanup + profile README

- Deleted 35 repos (21 forks, 6 course clones, 2 empty MERN shells, 6
  old/uni). Kept 5 originals. Rationale: every click from the profile now
  lands on real work; empty MERN repos would have undercut the MERN claim
  on the resume.
- Profile README lives at hxrsh159/hxrsh159 (GitHub has no API for pinned
  repos; the README repo is the API-addressable equivalent and renders
  above pins).
- Site copy must never cite repo counts (churn risk) — "public repos"
  without a number.

## ADR-016: Design system is a versioned file, not taste

- design-system/theozdev/MASTER.md generated by ui-ux-pro-max, curated
  overrides recorded in-file (dark palette + Inter from the tool's own
  developer-portfolio rules; light/luxury baseline rejected with reasons).
- All future UI changes must follow MASTER.md; deviations get added as
  overrides. Page-level rules go in design-system/theozdev/pages/.

## ADR-017: Self-host every static asset (no third-party hotlinks)

- Context: demo avatar was hotlinked to i.pravatar.cc — a third-party
  outage would break the hero, and it leaks visitor IPs to an external
  service.
- Rule: every asset served from the site lives in frontend/ (or Firebase
  Hosting generally). External images/fonts are downloaded and committed.
  Exception so far: Google Fonts CSS import (accepted risk, documented in
  MASTER.md).

## ADR-018: Visitor counter filters bots

- Context: counter climbed 15 -> 91 in days; most page loads are crawlers,
  and each load costs one Firestore write.
- Decision: counter.js skips the API call when navigator.webdriver is true
  or the UA matches bot|crawl|spider|slurp|headless. Bots see the em-dash
  placeholder; humans get the count.
- Why client-side: free, zero backend change, and honest — the API stays
  public (ADR-012); we just stop paying writes for non-humans.
- Note: headless-Chromium E2E checks now observe the placeholder by design;
  counter verification uses the API directly.

## ADR-019: Creative layer — what we adopt, what we skip

- Context: portfolio read as "resume on a website". Creative-portfolio
  patterns considered (2026-10-06): interactive connecting-dots canvas,
  sticky nav with anchor journey, accent-highlight headings, alternating
  visual project showcases, icon skill grid, staggered entrances.
- Adopted, adapted to MASTER.md (no framework, transform/opacity only,
  AA contrast, reduced-motion safe):
  1. Interactive constellation canvas in the hero — dots + proximity
     links, pointer-reactive; palette from CSS vars (theme-aware);
     density scales with area; paused off-screen/hidden tab; static
     under prefers-reduced-motion. Fits the network/cloud identity.
  2. Sticky top nav: wordmark, section anchors (Experience, Projects,
     Skills), Blog, Resume (PDF), theme toggle (moved out of hero);
     2px scroll-progress bar; active section highlighted via
     IntersectionObserver.
  3. Entrance motion: hero elements fly in staggered on load;
     h2 labels get an accent underline sweep on reveal; CTAs get a
     subtle magnetic pull (pointer-fine devices only).
  4. Terminal easter egg: ` key or ">_" nav button opens a fake shell
     (help/whoami/skills/resume/visitors/theme/clear/exit). System
     monospace stack (zero assets). Esc closes.
  5. Hero counter: "You're visitor #N" with tooltip naming the stack;
     hidden (not em-dash) for bots per ADR-018.
  6. Project showcase: alternating two-column panel with an inline SVG
     architecture diagram (self-hosted per ADR-017) instead of a plain
     job card.
- Skipped (with reasons): icon skill grid (license-clean tech logos are
  a maintenance/legal chore; text chips stay), contact form (needs a
  backend endpoint; mailto suffices), full-viewport canvas on every
  section (hero only — "decorative clutter" anti-pattern).
- Resume.pdf committed to frontend/ (78 KB, self-hosted) and linked
  from hero, nav and terminal.

## ADR-020: Creative layer revisions (same day, post first user review)

- Constellation moves from hero-scoped to fixed full-viewport page
  background (z-index -1 above aurora); pointer tracked on window; pause
  only on hidden tab. Rationale: hero-only read as a framed widget; the
  network should be the page's atmosphere.
- Hero visitor pill removed. Counter stays footer-only (ADR-018 bot
  filter unchanged). The hero tells the story; the footer shows the
  number.
- Every home section fills the window: min-height calc(100svh - 56px),
  flex-centered; taller content extends naturally. Home gains Blog and
  Resume sections so the sticky-nav journey is complete: Summary,
  Experience, Projects, Skills, Blog, Resume. Education folds into the
  Resume section (it is resume content).
- The PDF is labeled exactly "Resume" everywhere (nav, hero, footer,
  terminal). No "PDF" qualifiers in labels.

## ADR-021: Constellation feel — match the reference behavior exactly

- First pass read as "stringy web everywhere"; the reference's character
  comes from three behaviors we now replicate: (1) links form ONLY
  between dots within d_radius of the pointer — the network reveals
  around the cursor; (2) link/dot alpha fade with pointer distance
  (dots fully invisible beyond width/1.7 — no floor); (3) the cursor is
  itself a node (dots[0] follows it).
- Parameters from the reference's own source: 600/575/500/300/200/100
  dots by viewport width tier; link distance 70/60/55px; d_radius
  300/280/250; lineWidth 0.3; dot radius 0-1.5px; velocity ±0.5,
  bounce at edges. Palette stays ours (CSS vars): 4/5 glow-blue dots,
  1/5 accent pop; links glow-blue.
- The 48px grid overlay was removed from .aurora — it competed with
  constellation links on a texture level. Aurora blobs stay.
- Mobile (<=800px): dots only, no links (same as reference tiers).

## ADR-022: Even screen division — hero is a full screen too

- Problem (user screenshot): hero was natural height (~25% of the
  window) while each section was 100svh, so the first section's
  centered content landed far below the fold — dead space, uneven
  division.
- Fix: .hero also gets min-height calc(100svh - 56px) with flex
  centering, making the page a uniform stack of full-window screens:
  hero, summary, experience, projects, skills, blog, resume.
- Added scroll-margin-top: 56px on sections so anchor navigation from
  the fixed nav lands with the section top clear of the bar.
