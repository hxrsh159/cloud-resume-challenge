# Phase 2: Firestore (Datastore mode) + Rust Backend

Status: COMPLETE and verified against production Firestore.

## What exists

- `terraform/firestore.tf` — `(default)` database, DATASTORE_MODE,
  us-central1. Enables firestore + appengine APIs. Location is PERMANENT.
- `backend/Cargo.toml` — axum 0.8, tokio, tower-http(cors), reqwest
  (rustls, no default features), gcp_auth 0.12, serde, tracing.
  Release profile: lto=fat, codegen-units=1, strip, panic=abort.
- `backend/src/store.rs` — CounterStore trait (async_trait) +
  DatastoreStore impl. Increment = beginTransaction -> lookup(in tx) ->
  commit(upsert, TRANSACTIONAL). Conflicts (HTTP 409 / status ABORTED)
  retried 3x with 50ms-linear backoff. Entity: kind `counter`, name
  `visitors`, property `value` int64 (JSON-string encoded).
- `backend/src/main.rs` — routes: GET /api/visitors, GET /healthz.
  CORS allowlist: theozdev.com, www.theozdev.com, theozdev.web.app,
  theozdev.firebaseapp.com. Env: GCP_PROJECT_ID (required), PORT (def 8080).
- `backend/Dockerfile` — 4 stages: cargo-chef base -> planner (recipe.json)
  -> builder (musl-tools, x86_64-unknown-linux-musl static build) ->
  gcr.io/distroless/static-debian12:nonroot. Final image 9.04 MB.

## Verification evidence

- Host run: counter 1 -> 2 -> 3 (real Firestore via local ADC).
- Container run (podman, distroless): 4 -> 5 -> 6, healthz ok.
  Same entity — persistence proven across runtimes.
- Zero cargo warnings. Cargo.lock TLS stack: rustls + ring only.

## Errors hit and fixes

- `cargo add google-cloud-datastore`: crate gone from index -> ADR-007.
- Docker daemon down, no sudo: used podman (daemonless). Podman needs
  fully-qualified image names (docker.io/... prefix in Dockerfile).
- Container ADC mount failed twice: (1) nonroot uid 65532 cannot read
  harsh's 600-perm file -> copied to /tmp with 644; (2) gcp_auth env-var
  path rejects authorized_user JSON -> mount at gcloud well-known path
  /home/nonroot/.config/gcloud/application_default_credentials.json instead.
