# Design System Master File — theozdev.com

> **LOGIC:** When building a page, first check `design-system/theozdev/pages/[page-name].md`.
> If it exists, its rules override this file. If not, follow this file exactly.
> Any deviation must be recorded in the Overrides section below, with a reason.

**Project:** theozdev (resume site for Harshit Singh)
**Generated:** 2026-09-21 (ui-ux-pro-max v2)
**Category:** Developer portfolio / resume

---

## Overrides to the generated baseline (and why)

| Generated | Override | Reason |
|---|---|---|
| Light background (#F8FAFC) | Dark Mode palette (#0F172A base) | Generator's own `developer portfolio` reasoning returns Dark Mode (OLED); dark is the norm for developer audiences. |
| Cinzel / Josefin Sans | Inter single-family system | Generated pair is tagged "real estate, luxury" — wrong industry. `developer technical modern` typography search returns Inter System. |
| "Product Demo + Features" page pattern | Single-page resume pattern (below) | This site has no product video; pattern mismatch in the rule DB. |

Everything else (spacing, shadows, anti-patterns, checklist) is the
generator's baseline, unchanged.

---

## Page Pattern

**Single-page resume.** Section order is fixed:

1. Header — name, title, location, contact links
2. Summary
3. Experience (reverse-chronological job cards)
4. Featured Project
5. Skills grid
6. Education
7. Footer — live visitor counter

## Color Palette (dark)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#0F172A` | `--color-background` |
| Foreground | `#F8FAFC` | `--color-foreground` |
| Card | `#1B2336` | `--color-card` |
| Card Foreground | `#F8FAFC` | `--color-card-foreground` |
| Muted | `#272F42` | `--color-muted` |
| Muted Foreground | `#94A3B8` | `--color-muted-foreground` |
| Border | `#334155` | `--color-border` |
| Accent | `#22C55E` | `--color-accent` |
| On Accent | `#0F172A` | `--color-on-accent` |

Contrast: foreground/background 16.9:1; muted-foreground/background 7.4:1;
accent/background 8.1:1. All pass WCAG AA (4.5:1). Never put white text on
the accent green (2.3:1 — fails); use `--color-on-accent`.

## Typography — Inter System

- Single family: **Inter** (300/400/500/600/700) via Google Fonts.
- Display (name): Inter 700, tracking -0.015em
- H1/H2 (section labels): Inter 600, tracking -0.005em; section labels use
  Inter 500 uppercase, tracking +0.08em, muted-foreground color
- Body: Inter 400, 16px/1.6
- Dates/meta: Inter 400, muted-foreground, 0.9rem

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

## Spacing

| Token | Value |
|---|---|
| `--space-xs` | 0.25rem |
| `--space-sm` | 0.5rem |
| `--space-md` | 1rem |
| `--space-lg` | 1.5rem |
| `--space-xl` | 2rem |
| `--space-2xl` | 3rem |

Max content width: 760px, centered.

## Shadows (dark-mode values — deeper than the light baseline)

| Token | Value |
|---|---|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.4) |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.5) |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.5) |

## Components

### Job card

```css
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-lg);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.card:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); }
```

### Links

Accent color, no underline at rest, underline on hover/focus, 200ms
transition, visible `:focus-visible` outline (2px accent).

### Section label (h2)

Inter 500, uppercase, +0.08em tracking, muted-foreground, with a short
accent left-border or rule.

---

## Anti-Patterns (never)

- Emojis as icons (SVG only)
- Clickable elements without cursor:pointer
- Layout-shifting hover transforms (no scale on layout-affecting boxes)
- Text contrast below 4.5:1
- Instant state changes (transitions 150–300ms)
- Invisible focus states
- White text on accent green
- Decorative clutter; the resume is the content

## Pre-Delivery Checklist

- [ ] No emojis as icons
- [ ] cursor:pointer on clickable elements
- [ ] Transitions 150–300ms on state changes
- [ ] Contrast >= 4.5:1 everywhere
- [ ] Visible :focus-visible states
- [ ] prefers-reduced-motion respected
- [ ] Responsive at 375 / 768 / 1024 / 1440px
- [ ] No horizontal scroll on mobile
