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

## 2026-10-06: Creative layer shipped (ADR-019, benscott.dev reference)

Study: benscott.dev — canvas constellation hero, sticky anchor nav,
accent-highlight headings, alternating visual project showcases, icon
skill grid, staggered entrances. Adopted/adapted per ADR-019; skipped
icon skill grid (logo licensing chore), contact form (needs backend),
full-page canvas (clutter anti-pattern).

Shipped (all verified locally + live on theozdev.com):
- constellation.js: hero canvas, dots+proximity links+pointer attract,
  CSS-var palette (theme-aware), DPR cap 2, ~1 dot/9000px^2 (max 120),
  rAF paused off-screen/hidden tab, static frame on reduced-motion.
- Sticky nav (56px, blur): wordmark, Experience/Projects/Skills anchors
  with IntersectionObserver active state, Blog, Resume (resume.pdf new
  tab), terminal + theme toggle; 2px accent scroll-progress bar.
  Section anchors hidden <=600px.
- Entrance: body.loaded staggered fly-in (60ms steps); h2 accent
  underline sweep on reveal; magnetic CTAs (pointer:fine, 4px max).
- terminal.js: backtick or ">_" opens shell overlay; help/whoami/skills/
  resume/visitors/ping/theme/clear/exit; history arrows; Esc closes.
  NOTE: visitors/ping hit the live API — CORS allowlist means they fail
  on localhost by design (works from theozdev.com origins).
- Hero visitor pill: "You're visitor #N — served live by this site's
  Rust API" (hidden for bots, ADR-018; no em-dash in hero).
- Projects: .showcase two-column with inline SVG architecture diagram
  (You->Firebase CDN + Cloud Run->Firestore, GitHub WIF edge), links to
  source + build-log post.
- resume.pdf (78 KB) self-hosted; linked hero/nav/footer/terminal.
- favicon.svg (>_ on dark rounded square) + favicon-32.png via magick;
  link tags on all 3 pages.
- Gotcha fixed: .terminal-overlay display:flex overrode the hidden
  attribute -> [hidden]{display:none} guard added.
- Gotcha: Chrome desktop min window width ~500px faked mobile overflow;
  real 375px test must use device emulation, not window resize.
- Verified: 0 console errors; dark/light/mobile screenshots; terminal
  E2E; blog shell consistent; pipeline run 37381913406 green; live
  routes + content types all 200 (HTML CDN cache max-age=3600 — warm
  browsers may show old shell for up to an hour).
