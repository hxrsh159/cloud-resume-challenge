# Page: index (portfolio presentation layer)

Overrides MASTER.md only where listed. Source: ui-ux-pro-max
"developer portfolio hero banner" run 2026-09-23 — style: Dark Mode (OLED),
key effects: minimal glow, dark-to-light transitions, visible focus.
Avoid: slow performance. All animation must be transform/opacity only
(GPU-composited); no layout-affecting motion.

## Hero banner (new top section, replaces plain header)

- Full-width band above the content column: avatar (round, accent ring),
  name (Inter 700, minimal glow: text-shadow 0 0 10px rgba(34,197,94,.35)),
  rotating role line (Software Engineer / Rust / Cloud & DevOps / Platform
  Engineering), contact links, two CTAs: primary "GitHub" (accent fill),
  secondary "Email me" (border style).
- Avatar: demo placeholder (i.pravatar.cc) until a real photo is supplied;
  swap = replace the `src` in index.html only.
- Section labels and job cards unchanged from MASTER.

## Background (whole page)

- Two large radial "aurora" blobs (accent green at 12% alpha, deep blue
  #2563EB at 10% alpha — new secondary glow token `--color-glow-blue`),
  slow drift animation (40s+), plus a faint static grid overlay
  (rgba(148,163,184,.05) lines, 48px pitch).
- Blobs are position:fixed, pointer-events:none, behind content.

## Transitions

- Scroll-reveal on sections and job cards: opacity 0 -> 1, translateY(16px)
  -> 0, 500ms ease, staggered 80ms per item, triggered once via
  IntersectionObserver (threshold 0.12).
- Role text rotation: fade swap every 2.8s (opacity transition only).
- Everything disabled under prefers-reduced-motion (static final state).
- Card hover from MASTER (border-accent + shadow) kept; add translateY(-2px)
  (transform-only, allowed).

## Experience presentation

- Job cards gain a left accent rail: 2px border-left in --color-accent on
  the timeline, with a small accent dot marker at each card's top-left.
  Implemented as a container class .timeline on #experience; cards keep
  MASTER styling otherwise.

## Theme toggle (added 2026-09-29)

- Dark default; toggle button (sun/moon SVG, no emoji) top-right of hero;
  choice persisted in localStorage key `theme`; applied via data-theme on
  <html> before first paint (inline script in <head> to avoid flash).
- Light palette per MASTER.md "Color Palette (light)".

## Blog (added 2026-09-29)

- /blog/ index: card list (title, date, excerpt), newest first.
- Posts are hand-authored static HTML at /blog/<slug>.html — no build step,
  no JS framework; article typography in styles.css (.post-*).
- Blog pages reuse the site shell (aurora, theme toggle, footer counter).
- Nav: "Blog" CTA on the home hero; "Home" link on blog pages.

## Creative layer (added 2026-10-06, ADR-019; revised ADR-020)

- Constellation canvas: position:fixed full-viewport page background
  (z-index -1, after .aurora so it paints above blobs, below content).
  Behavior (revised 2026-10-06, ADR-021): the network REVEALS around the
  cursor — links are drawn only between dots within d_radius of the
  pointer, with alpha fading to the radius edge; dot alpha also fades
  with pointer distance. Cursor itself is a node (dots[0] follows it).
  Dots: radius 0-1.5px, 4/5 --color-glow-blue + 1/5 --color-accent
  (theme-aware via CSS vars); links: --color-glow-blue, lineWidth 0.3.
  Density by viewport width: >1600: 600 dots/link 70px/radius 300;
  >1300: 575/60/280; >1100: 500/55/250; >800: 300 dots, no links;
  >600: 200; else 100. Velocity ±0.5 px/frame, bounce at edges.
  DPR-aware; rAF paused on hidden tab; one static frame (pointer
  centered) under prefers-reduced-motion.
- Full-viewport sections (ADR-020/022): the page is a uniform stack of
  full-window screens, including the hero — min-height:
  calc(100svh - 56px), flex-centered content; taller content
  (Experience) simply extends the section. Sections: hero, Summary,
  Experience, Projects (showcase), Skills, Blog, Resume. Education
  folded into the Resume section (it is resume content). Footer keeps
  natural height. Sections have scroll-margin-top: 56px so anchor
  navigation clears the fixed nav.
- Sticky nav (56px): wordmark "harshit singh" left; anchors Summary /
  Experience / Projects / Skills / Blog / Resume (all in-page) right;
  theme toggle lives here (removed from hero); ">_" terminal button. 2px
  accent scroll-progress bar under nav. Active anchor gets accent color
  + 2px underline offset. Body gets padding-top 56px. Mobile (<=600px):
  section anchors hidden, toggle/terminal stay.
- Entrance motion: hero children fly in on load (translateY 14px + fade,
  500ms, 60ms stagger); h2 labels grow an accent underline (width sweep
  300ms) when their section reveals; CTA buttons get magnetic pull (max
  4px translate toward pointer, pointer:fine only, transform-only).
- Terminal overlay: fixed centered panel (max 560px), system monospace,
  opens on ` (backtick) keydown or ">_" click; commands help / whoami /
  skills / resume (opens PDF) / visitors (live count) / theme / clear /
  exit; Esc or exit closes; input autofocused; aria-modal dialog.
- Visitor counter lives in the footer only (ADR-020: hero pill removed —
  the hero tells the story, the footer shows the number).
- "Resume" naming (ADR-020): the PDF is labeled exactly "Resume"
  everywhere it is linked.
- Project showcase: .showcase two-column (SVG diagram panel on accent-
  tinted muted background, text panel), alternating direction per item;
  collapses to stacked on mobile. Diagram is inline SVG using currentColor
  + CSS vars (theme-aware, zero assets).
- Blog section (home): latest post card + "all posts" link to /blog/.
- Resume section (home): one-line pitch, primary download button,
  education list.
