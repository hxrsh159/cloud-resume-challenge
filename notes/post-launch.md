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

## 2026-10-06: Creative layer shipped (ADR-019)

Reference study of creative dev portfolios — canvas constellation,
sticky anchor nav, accent-highlight headings, alternating visual project
showcases, icon skill grid, staggered entrances. Adopted/adapted per
ADR-019; skipped icon skill grid (logo licensing chore), contact form
(needs backend).

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

## 2026-10-06 (later): Creative layer revisions (ADR-020, user review)

- All third-party portfolio references scrubbed from notes/design docs.
- Constellation: hero-only -> fixed full-viewport background (z-index -1
  above aurora). Window pointer tracking; pauses only on hidden tab.
- Hero visitor pill REMOVED — counter is footer-only again (ADR-018).
- Home sections now fill the window (min-height calc(100svh - 56px),
  flex-centered; Experience extends taller). New #blog section (latest
  post card + all-posts link) and #resume section (pitch + Resume
  button + education, which folded in from the deleted Education
  section). Nav anchors: Summary/Experience/Projects/Skills/Blog/Resume
  (all in-page; mobile still hides anchors).
- PDF is labeled exactly "Resume" everywhere (footer was "Resume (PDF)";
  terminal help reworded).
- Verified locally (0 console errors, dark/mobile screenshots, no
  horizontal overflow at 375px emulation) and live via DOM assertions +
  screenshot. Pipeline run 37383536335 green.

## 2026-10-06 (constellation fix, ADR-021)

User review: "still not like the reference." Root-caused by reading the
reference's actual minified JS (not guessing): the character comes from
REVEAL behavior, not static web — links form only between dots within
d_radius of the cursor, alpha fades to the radius edge, dot alpha fades
to zero beyond width/1.7 (no floor), and the cursor is a node
(array[0] follows the mouse). Parameters lifted from their source:
600/575/500/300/200/100 dots by width tier, link 70/60/55px, d_radius
300/280/250, lineWidth 0.3, dot radius 0-1.5, velocity ±0.5 bounce.
Palette stays ours (CSS vars): 4/5 glow-blue + 1/5 accent pop dots,
glow-blue links. Also removed the 48px grid overlay (competed with the
links). Side-by-side screenshots at 1440x900 with the same synthetic
pointer position confirm matching character; live verified (computed
backgroundImage: none; pipeline 37385407294 green).
Lesson: when a user says "make it like X", read X's source first —
visual guessing produced a statically-visible web, the wrong metaphor.

## 2026-10-06 (even screen division, ADR-022)

User screenshot: hero was natural height (~25% of window) while sections
were 100svh — Summary's centered content landed far below the fold:
dead space, uneven division. Fix: hero is a full screen too
(min-height calc(100svh - 56px), flex-centered), so the page is a
uniform stack: hero, summary, experience, projects, skills, blog,
resume. Added scroll-margin-top: 56px on sections (anchors clear the
fixed nav). Verified at emulated 1920x940: hero 884 + 56 nav = 940
exactly; anchor lands at section top; pipeline 37414837284 green.
Gotcha reconfirmed: headless window resize floors at ~700px (silently
selects the mobile dot tier) — ALWAYS verify layout via CDP viewport
emulation, never window resize.
Also: "condensed to two pages" resume copy tweak shipped (run
37386646716).

## 2026-10-06 (Australian palette + wide layout, ADR-023)

User requests: content uses too little page space; palette should evoke
the Australian flag + cricket-team gold; remove hero Resume button.
- Palette (MASTER.md rewritten, contrast re-verified): dark bg #0A1633
  (flag navy), accent #FFCD00 cricket gold (10.3:1), glow #3B6BFF royal,
  #FF4757 flag red = constellation dots only (never text). Light theme:
  navy ink, ochre gold #8A6D00 (5.7:1). Aurora blobs gold + royal;
  avatar/h1 glow gold.
- Constellation dots: 3/5 royal, 1/5 gold, 1/5 red.
- Layout: .container 760 -> 1080px; prose caps 72ch (#summary p,
  .showcase-text, .resume-block); body 17px at >=1400px (rem scales).
- Hero Resume button removed; PDF paths remain nav anchor, resume-
  section CTA, footer link, terminal command.
- Verified: dark/light screenshots at emulated 1920x940, live DOM
  assertions (accent #FFCD00, bg #0A1633, container 1080, hero button
  absent); pipeline 37430576241 green.
- Wordmark changed to "Welcome to Harsh's space" (run 37415636588).
