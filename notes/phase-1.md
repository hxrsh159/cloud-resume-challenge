# Phase 1: Frontend + Production Static Hosting

Status: deployed. `theozdev.web.app` live; `theozdev.com` pending cert.

## What exists

- `frontend/index.html` — semantic resume: header/main/section/footer,
  ARIA labels, contact nav, visitor counter span in footer.
- `frontend/styles.css` — dark theme, CSS custom properties, responsive
  grid skills section, mobile breakpoint at 600px.
- `frontend/counter.js` — fetches `GET {API_URL}/api/visitors`, writes
  `data.count` into `#visitor-counter`. API_URL is a placeholder until
  Phase 3. On any failure it logs and renders "unavailable" (graceful
  degradation: page never breaks before the API exists).
- `terraform/` — Firebase project + Hosting site + custom domain, all in
  Terraform (google + google-beta providers, ~6.x).
- `firebase.json` — hosting config: public dir `frontend/`, site
  `theozdev`, cache headers (js/css 1h, images 24h).
- `.firebaserc` — binds repo to GCP project.

## Terraform resources (main.tf)

1. `google_project_service` x2: `firebase.googleapis.com`,
   `firebasehosting.googleapis.com`
2. `google_firebase_project.default` — attaches Firebase to the GCP project
3. `google_firebase_hosting_site.site` — site_id `theozdev`
   (globally unique; yields theozdev.web.app)
4. `google_firebase_hosting_custom_domain.apex` — `theozdev.com`,
   `wait_dns_verification = false` so apply returns immediately; cert
   provisions async after DNS is correct.

## DNS (Cloudflare, both grey-cloud / DNS-only)

| Type | Name | Value |
|---|---|---|
| A | @ | 199.36.158.100 (Firebase anycast) |
| TXT | @ | hosting-site=theozdev (domain ownership proof) |

## Cert provisioning state machine

1. DNS records live -> Firebase checker polls (minutes to ~1h)
2. TXT found -> domain verified
3. Google issues managed SSL cert (~5-15 min)
4. Edge routes theozdev.com over HTTPS
Until step 3, the edge refuses the Host entirely (connection fails — normal).

## How to explain the mechanics

- Firebase Hosting = Google-managed static hosting on a global edge CDN.
  Content is pushed (deploy), replicated to edge POPs, served with HTTP/2
  + HSTS automatically.
- Managed TLS: Google proves control of the domain via the DNS records,
  issues and auto-renews a cert, terminates TLS at the edge.
- Terraform: declarative; `plan` shows diff, `apply` converges real infra
  to the declared state; providers (google / google-beta) map HCL blocks
  to GCP REST API calls; ADC (`gcloud auth application-default login`)
  supplies credentials.

## Errors hit and fixes

- Domain-named GCS bucket would 403 (needs Search Console verification) ->
  avoided entirely by Firebase pivot (ADR-002/003).
- Cloudflare banner pushed proxying -> kept grey-cloud (ADR-004).
- `theozdev.com` did not resolve -> root cause: DNS zone was empty; records
  had not been created yet. Fix: create A + TXT records.
