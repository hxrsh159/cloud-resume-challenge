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
| Generic green accent / slate navy | Australian flag + cricket gold palette | Owner identity: Australian citizen, cricket nation (ADR-023). |
| 760px content column | 1080px | Wide screens left too much unused space (ADR-023). |

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

## Color Palette (dark) — Australian identity (ADR-023, 2026-10-06)

Inspired by the Australian flag (royal blue, red, white) and the national
cricket team's gold. Background is a deep navy derived from the flag's
blue field; the accent is cricket gold; flag red is a sparing decorative
pop (constellation dots only, never text).

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#0A1633` | `--color-background` |
| Foreground | `#F4F7FF` | `--color-foreground` |
| Card | `#111F42` | `--color-card` |
| Card Foreground | `#F4F7FF` | `--color-card-foreground` |
| Muted | `#1A2A52` | `--color-muted` |
| Muted Foreground | `#9FB0D8` | `--color-muted-foreground` |
| Border | `#2A3C6B` | `--color-border` |
| Accent (cricket gold) | `#FFCD00` | `--color-accent` |
| On Accent | `#0A1633` | `--color-on-accent` |
| Glow blue (flag royal) | `#3B6BFF` | `--color-glow-blue` |
| Flag red (decor only) | `#FF4757` | `--color-flag-red` |

Contrast: foreground/background ~17:1; muted-foreground/background ~7.3:1;
accent/background ~10.3:1. All pass WCAG AA (4.5:1). On-accent is the navy
background — never white text on gold.

## Color Palette (light)

Dark remains the default/brand. Light theme is user-selectable via toggle
(`data-theme="light"` on <html>, persisted in localStorage). Gold must be
darkened heavily for AA on white:

| Role | Hex |
|------|-----|
| Background | `#FAFBFF` |
| Foreground | `#0A1633` |
| Card | `#FFFFFF` |
| Muted | `#EDF1FA` |
| Muted Foreground | `#44527A` |
| Border | `#C6D0E8` |
| Accent (ochre gold) | `#8A6D00` (~5.7:1 on background — AA) |
| On Accent | `#FFFFFF` |
| Glow blue | `#3B6BFF` |

Light-theme rules: aurora blobs drop to 40% opacity; name glow and avatar
glow removed; shadows revert to the light baseline (rgba(0,0,0,0.05-0.1)).

## Layout (ADR-023)

Max content width: **1080px**, centered (was 760px — widened after user
feedback that content used too little of wide screens). Prose blocks cap
at ~72ch for readable measure. Base font steps to 17px at viewports
>= 1400px (rem tokens scale with it).

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

Max content width: 1080px, centered (see Layout, ADR-023).

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
