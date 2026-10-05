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

## 2026-09-29: Real avatar, theme toggle, blog, SEO

- Avatar: real photo (IMG_0493.HEIC citizenship ceremony, center-person
  crop 1400px @ +780+100 -> 320x320, 25 KB) at frontend/avatar.jpg.
- Theme toggle: dark default + light palette (MASTER.md "Color Palette
  (light)", accent #15803D for AA on white). data-theme on <html>,
  localStorage, pre-paint inline script prevents flash; SVG sun/moon,
  no emoji (anti-pattern rule).
- Blog: /blog/ index + first post (building-this-site.html). Hand-authored
  static HTML, no build step. Shared shell (aurora, toggle, footer).
- SEO: robots.txt, sitemap.xml, canonical URLs, og/twitter meta on all
  pages, JSON-LD Person (home) + BlogPosting (posts).
- Verified: light theme screenshot (file:// with data-theme injected),
  blog index + post screenshots, all routes 200, pipeline green.
- Publishing workflow: write frontend/blog/<slug>.html (copy post shell),
  add card to blog/index.html, add <url> to sitemap.xml, push.

## 2026-10-06: Creative UI exploration (benscott.dev reference)

Goal: evolve beyond "resume on a website" toward a creative dev
portfolio. Reference study: benscott.dev (creative front-end developer
portfolio). Direction TBD with user; design-system-first per ADR-016.
