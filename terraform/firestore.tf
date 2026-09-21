# ---------------------------------------------------------------------------
# Phase 2: Firestore in Datastore mode (visitor counter storage)
#
# WARNING: location_id is PERMANENT for the project's (default) database.
# It cannot be changed after creation. Datastore mode chosen per spec:
# server-side access only (Rust backend), no client SDKs, no security rules.
# ---------------------------------------------------------------------------

resource "google_project_service" "firestore_deps" {
  for_each = toset([
    "firestore.googleapis.com",
    "appengine.googleapis.com", # Datastore mode requires App Engine API present
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "DATASTORE_MODE"

  # Protect the irreversible: prevent accidental deletion of the database.
  deletion_policy = "DELETE" # Phase 2 default; flip to "PREVENT" once live data matters

  depends_on = [google_project_service.firestore_deps]
}
