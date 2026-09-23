# Phase 6: Documentation + Resume Polish

Status: COMPLETE. Project finished 2026-09-21.

## What exists

- `README.md` (repo root) — architecture doc: ASCII data-flow diagram
  (request path AND CI/CD path), design-decision summary linking to ADRs,
  repo layout, reproduce/operate commands, security posture.
- STAR bullets finalized in interview-qa.md (three: serverless platform
  engineering / zero-trust CI/CD / IaC + verification culture).

## README honest-accuracy note

The README documents the Firebase Hosting pivot (ADR-002) explicitly rather
than pretending the GCS+LB spec was built. The pivot story is a feature:
cost analysis drove an architecture change; the reasoning is on record.

## Interview-pack inventory (what to review before interviews)

1. README.md diagram — 60-second architecture walkthrough
2. notes/decisions.md — 15 ADRs, every "why" answered
3. notes/interview-qa.md — prepared Q&A incl. debugging stories
   (healthz interception, :latest no-op, billing precondition)
4. Commit history — one commit per phase, each deployable
