terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }

  # PHASE 1 runs against local state. In Phase 4 we migrate this to a
  # remote GCS backend so GitHub Actions shares one consistent state file.
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ---------------------------------------------------------------------------
# APIs
# ---------------------------------------------------------------------------
resource "google_project_service" "required" {
  for_each = toset([
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ---------------------------------------------------------------------------
# Firebase Hosting — global edge CDN + free managed SSL, $0 on Spark tier
# ---------------------------------------------------------------------------
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.required]
}

resource "google_firebase_hosting_site" "site" {
  provider = google-beta
  project  = var.project_id
  site_id  = "theozdev" # serves at https://theozdev.web.app out of the box

  depends_on = [google_firebase_project.default]
}

# Custom domain with Google-managed SSL. wait_dns_verification = false so
# `apply` returns immediately; Firebase provisions the cert asynchronously
# once the DNS records in the `dns_records_to_create` output exist.
resource "google_firebase_hosting_custom_domain" "apex" {
  provider              = google-beta
  project               = var.project_id
  site_id               = google_firebase_hosting_site.site.site_id
  custom_domain         = var.domain_name
  wait_dns_verification = false
}
