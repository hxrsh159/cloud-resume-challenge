# Phase 5: Refactoring + Enterprise Testing

Status: COMPLETE. 8 unit tests green locally and as a CI deploy gate;
compose stack verified live.

## Refactors

- main.rs: `app(store)` builder extracted from main() — router mounts with
  any CounterStore, no env vars needed in tests.
- store.rs: `post()` helper dedupes bearer attachment across
  begin/lookup/commit; `bearer()` now returns Option (None on emulator).
- store.rs: DATASTORE_EMULATOR_HOST switches to plain HTTP, no credentials
  (emulator ignores auth). This is the seam the compose stack uses.
- CORS allow_origin parse changed from ? to unwrap() inside app() — the
  values are compile-time constants; a failure is a bug, not a runtime
  condition.

## Tests (backend)

Handler tests (mock CounterStore, tower oneshot):
- success returns {count:1} with 200
- store failure returns 500 with generic message; no internal detail leaks;
  no count field
- 50 concurrent requests receive exactly 1..=50 (uniqueness proof)
- /health returns ok

classify() mapping tests:
- HTTP 409 -> Retryable
- 400 + ABORTED body -> Retryable
- 500 INTERNAL -> Fatal
- 403 PERMISSION_DENIED -> Fatal (never retry auth failures)

## Compose stack (docker-compose.yml)

datastore-emulator (gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators,
--no-store-on-disk, port 8085) + api (build ./backend, port 8081).
Verified: podman-compose up --build -> counter 1..5 while prod was at 14
(in-memory emulator = perfect isolation). Teardown: podman-compose down.

## CI gate

backend.yml runs `cargo test --locked` before docker build; verified in a
dispatched run (8 passed -> deploy proceeded). Failing tests cannot reach
Cloud Run.

## Errors hit and fixes

- YAML: unquoted step name containing ": " is invalid YAML — LSP caught it;
  quote names with colons.
- Workflow-only commit did not trigger the pipeline (paths filter) —
  dispatched manually to validate the gate.
