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
