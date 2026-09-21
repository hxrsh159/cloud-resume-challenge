# ---------------------------------------------------------------------------
# Phase 3: Artifact Registry + Cloud Run for the Rust visitor-counter API
# ---------------------------------------------------------------------------

resource "google_project_service" "phase3" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "billingbudgets.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ---------------------------------------------------------------------------
# Artifact Registry — Docker image repository
# ---------------------------------------------------------------------------
resource "google_artifact_registry_repository" "backend" {
  location      = var.region
  repository_id = "resume-api"
  description   = "Docker images for the resume visitor-counter API"
  format        = "DOCKER"

  depends_on = [google_project_service.phase3]
}

# ---------------------------------------------------------------------------
# Runtime identity — least privilege: datastore.user only, nothing else
# ---------------------------------------------------------------------------
resource "google_service_account" "api" {
  account_id   = "resume-api"
  display_name = "resume-api Cloud Run runtime identity"
}

resource "google_project_iam_member" "api_datastore" {
  project = var.project_id
  role    = "roles/datastore.user" # entity read/write; no admin, no other APIs
  member  = "serviceAccount:${google_service_account.api.email}"
}

# ---------------------------------------------------------------------------
# Cloud Run service — scale to zero, public ingress (CORS restricts browsers)
# ---------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "api" {
  name     = "resume-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = 0 # $0 at rest
      max_instance_count = 3
    }

    containers {
      # Digest-pinned: identical template = no new revision (the :latest
      # trap), so deploys must reference an immutable digest.
      image = var.image_digest != "" ? "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend.repository_id}/resume-api@${var.image_digest}" : "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend.repository_id}/resume-api:latest"

      ports { container_port = 8080 }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      resources {
        # cpu_idle = true: CPU only allocated while handling requests.
        # Required for the scale-to-zero / $0-at-rest cost model.
        cpu_idle = true
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [google_project_service.phase3]
}

# Public API: the counter is intentionally world-callable. Browser access is
# constrained by the CORS allowlist in the Rust app itself.
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
