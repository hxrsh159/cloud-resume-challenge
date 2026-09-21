# ---------------------------------------------------------------------------
# Phase 4: Workload Identity Federation — keyless GitHub Actions auth.
#
# Flow: GitHub mints a short-lived OIDC token per workflow run -> Google STS
# exchanges it (pool trust) -> CI service account access token. No JSON key
# exists anywhere; a stolen run token expires in minutes and only works for
# assertion.repository == hxrsh159/cloud-resume-challenge.
# ---------------------------------------------------------------------------

resource "google_project_service" "phase4" {
  for_each = toset([
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.phase4]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub OIDC"

  # Hard scope: only this repository can ever exchange tokens.
  attribute_condition = "assertion.repository == 'hxrsh159/cloud-resume-challenge'"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# CI identity — separate from the runtime SA (resume-api).
resource "google_service_account" "ci" {
  account_id   = "github-ci"
  display_name = "GitHub Actions CI (keyless via WIF)"
}

resource "google_service_account_iam_member" "ci_wif_binding" {
  service_account_id = google_service_account.ci.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/hxrsh159/cloud-resume-challenge"
}

# Roles the CI SA needs to run terraform apply + firebase deploy + docker push.
# Each maps to resources this config manages. Deliberately NOT roles/editor.
resource "google_project_iam_member" "ci" {
  for_each = toset([
    "roles/run.admin",                    # Cloud Run services
    "roles/artifactregistry.admin",       # AR repos + image push
    "roles/firebase.admin",               # Firebase Hosting sites + custom domains
    "roles/datastore.owner",              # Firestore database resource
    "roles/iam.workloadIdentityPoolAdmin",# WIF pool/provider in state
    "roles/iam.serviceAccountAdmin",      # service accounts in state
    "roles/serviceusage.serviceUsageAdmin",# enabled APIs in state
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ci.email}"
}

# Cloud Run deploys attach the runtime SA -> CI must be allowed to act as it.
resource "google_service_account_iam_member" "ci_act_as_runtime" {
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci.email}"
}

# Terraform state bucket access (bucket-scoped, not project-scoped).
resource "google_storage_bucket_iam_member" "ci_tfstate" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.ci.email}"
}
