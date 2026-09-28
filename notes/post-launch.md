# Post-Launch Changes (after Phase 6 closeout)

## 2026-09-23: Portfolio UI revamp

Site repositioned from "resume posted online" to "portfolio":

- Hero banner: avatar (self-hosted demo placeholder), name with minimal
  glow, rotating role line (2.8s fade cycle), CTA buttons
  (GitHub primary / LinkedIn / Email).
- Background: two aurora blobs (accent green 12% alpha, --color-glow-blue
  #2563EB 10% alpha — new token) + 48px grid overlay; 44-52s drift,
  transform/opacity only.
- Experience: vertical timeline rail with accent dot markers.
- Scroll reveals: IntersectionObserver, fade+translateY, 80ms stagger,
  fire-once; reduced-motion shows final state.
- Spec recorded FIRST at design-system/theozdev/pages/index.md (ADR-016
  process: page-level override of MASTER.md). Style input from
  ui-ux-pro-max run "developer portfolio hero banner" (Dark Mode OLED,
  minimal glow, perf-safe effects).
- main.js added (rotator + reveal); counter.js unchanged at that point.
- Deployed via frontend pipeline (green). Real-browser verified: 0 console
  errors, counter rendered, both viewports screenshotted.

## 2026-09-23/29: Verification battery results

- Counter jumped 15 -> 45 -> 91: organic traffic is mostly crawlers.
  Decision: bot filter in counter.js (ADR-018).
- CORS: ACAO echoes only for theozdev.com and theozdev.web.app; foreign
  origin gets 200 with no ACAO (browser-blocked). Per ADR-012 design.
- Performance: HTML 8.4 KB; assets <400 ms TTFB; API ~480 ms (scale-to-zero
  cold starts accepted; min 1 would cost ~$15/mo — declined).
- Reduced-motion fallback confirmed via --force-prefers-reduced-motion.
- pravatar hotlink replaced by self-hosted frontend/avatar-demo.jpg
  (ADR-017).
