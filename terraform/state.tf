# ---------------------------------------------------------------------------
# Phase 4: Terraform remote state
# Bootstrap order: (1) apply -target=google_storage_bucket.tfstate with local
# state, (2) uncomment the backend block in main.tf, (3) terraform init
# -migrate-state. State is versioned so corruption is recoverable.
# ---------------------------------------------------------------------------

resource "google_storage_bucket" "tfstate" {
  name          = "${var.project_id}-tfstate"
  location      = upper(var.region)
  force_destroy = false

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }
}
