---
version: alpha
name: PETRAband-design-analysis
description: A bilingual badge-craft editorial interface for PETRAband, the Thai Classical Music club of the Faculty of Commerce and Accountancy, Chulalongkorn University. The system anchors on a warm parchment canvas with confident navy headlines, a single coral accent ribbon, and flat navy product/performance surfaces. Brand voltage comes from the parchment/navy/coral trio — deliberately printed and badge-like where most "college club" brands lean playful and gradient-heavy. Type voice runs Roboto for Latin and Sarabun for Thai, stacked or separated by a middle-dot, never interleaved. The circular longship-and-wave mark anchors the wordmark.

colors:
  primary: "#1B3A6B"
  primary-active: "#152E55"
  primary-disabled: "#C5D5E5"
  ink: "#0B2540"
  body: "#33455C"
  body-strong: "#1B3A6B"
  muted: "#5C6B80"
  muted-soft: "#8A95A6"
  hairline: "#D8D0BD"
  hairline-soft: "#E5DECC"
  canvas: "#F1ECDF"
  surface-soft: "#FAF7F0"
  surface-card: "#FAF7F0"
  surface-cream-strong: "#E5DECC"
  surface-dark: "#1B3A6B"
  surface-dark-elevated: "#234277"
  surface-dark-soft: "#0B2540"
  on-primary: "#FFFFFF"
  on-dark: "#F1ECDF"
  on-dark-soft: "#C5D5E5"
  accent-coral: "#DD5085"
  accent-coral-soft: "#F2B6CB"
  success: "#4A9D6E"
  warning: "#C98A2C"
  error: "#B6433F"

typography:
  display-xl:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.01em
  display-lg:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  display-md:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.005em
  display-sm:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  title-lg:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-md-thai:
    fontFamily: "Sarabun, Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  body-sm:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow-uppercase:
    fontFamily: "Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 1.5px
  button:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Roboto, Sarabun, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px
  section-mobile: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-coral:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-secondary-on-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.accent-coral}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-band-inverted:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-photo-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "{colors.hairline-soft}"
  ensemble-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "{colors.hairline}"
  concert-card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  value-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  callout-card-coral:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  member-bio-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 20px
  text-input:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
    border: "{colors.hairline}"
  text-input-focused:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "{colors.accent-coral}"
  apply-modal:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.surface-cream-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  badge-pill:
    backgroundColor: "{colors.surface-cream-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-coral:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.on-primary}"
    typography: "{typography.eyebrow-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  wave-divider:
    backgroundColor: transparent
    fillFrom: "{colors.canvas}"
    fillTo: "{colors.surface-dark}"
  cta-band-coral:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.on-primary}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  cta-band-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

PETRAband.club reads as a **printed badge, not a screen-native app** — the base atmosphere is a **warm parchment canvas** (`{colors.canvas}` — #F1ECDF), deliberately not pure white, echoing the cream "coin" of the round longship mark. Headlines run **Roboto 700** with tight negative tracking, paired with **Sarabun** for every Thai run — the two scripts sit on separate lines or split by a middle-dot `·`, never interleaved mid-sentence. The combination feels like a club crest stamped on good paper, not a SaaS landing page.

Brand voltage comes from the **navy + coral pairing** — Navy 700 (`{colors.primary}` — #1B3A6B) carries the overwhelming majority of the weight (ship body, headlines, primary actions), while Coral 500 (`{colors.accent-coral}` — #DD5085) is reserved for exactly one beat per layout: the ribbon, a focus ring, a single CTA, a "favorited" icon. **Never two corals in one viewport.**

The system has three surface modes that alternate band-by-band:
1. **Parchment canvas** (`{colors.canvas}`) — default body floor
2. **Bone cream cards** (`{colors.surface-card}`) — feature/ensemble card backgrounds
3. **Flat navy surfaces** (`{colors.surface-dark}`) — hero inversions, concert announcement cards, pre-footer CTA, footer itself

There are no drop shadows anywhere in the system — elevation comes entirely from surface-tone shift and 1px hairline borders, the way a badge's lift comes from layered card stock, not from a glow.

**Key Characteristics:**
- Warm parchment canvas (`{colors.canvas}` — #F1ECDF) with deep navy ink text (`{colors.ink}` — #0B2540). The cream is structural — it's the coin the badge is stamped on, not a decorative tint.
- Navy primary CTA (`{colors.primary}` — #1B3A6B), used everywhere; coral (`{colors.accent-coral}` — #DD5085) used scarcely, one beat per layout only.
- Roboto 700 display headlines with tight negative tracking, paired with Sarabun for Thai — bilingual, equal weight, never mid-sentence mixing.
- Flat navy product/performance cards (`{colors.surface-dark}` — #1B3A6B) carrying concert announcements, ensemble showcases — no gradients, no photography-as-background, just flat navy plate with white/cream type.
- Bone feature cards (`{colors.surface-card}` — #FAF7F0) — barely a shade off canvas, used for ensembles, values, and content cards.
- The circular longship-and-wave mark anchors the wordmark; clear space = the height of the "P" in PETRAband on every side.
- Border radius is unapologetically round and hierarchical: `{rounded.md}` (10px) for buttons + inputs, `{rounded.lg}` (16px) for content cards, `{rounded.xl}` (24px) for hero cards, `{rounded.pill}` for badges/chips, full circle for avatars and the logo itself. **Never sharp corners** — the logo is a circle and everything else honors that lineage.
- Section rhythm `{spacing.section}` (96px desktop / 64px mobile). Card internal padding stays generous at `{spacing.lg}`–`{spacing.xl}` (24–32px).

## Colors

### Brand & Accent
- **Navy / Primary** (`{colors.primary}` — #1B3A6B): The signature PETRAband navy. Carries the ship body in the logo, every headline, every primary CTA background. The dominant brand color — roughly 95% of color weight in any layout.
- **Navy Active** (`{colors.primary-active}` — #152E55): The press / hover-darker variant.
- **Navy Disabled** (`{colors.primary-disabled}` — #C5D5E5): A desaturated blue-tinted disabled state (reuses the "cloud" divider tone).
- **Coral / Accent** (`{colors.accent-coral}` — #DD5085): The ribbon color from the logo. Used sparingly — one CTA, one ribbon, one focus ring per viewport. The system's single permitted "loud" moment.
- **Coral Soft** (`{colors.accent-coral-soft}` — #F2B6CB): A muted coral tint used only for selected/favorited backgrounds at low intensity — never as a primary fill.

### Surface
- **Canvas / Parchment** (`{colors.canvas}` — #F1ECDF): The default page floor. The cream "coin" of the badge — structural, not decorative. Never replaced with pure white.
- **Surface Soft / Bone** (`{colors.surface-soft}` — #FAF7F0): Elevated surfaces and inputs on parchment — cards, form fields.
- **Surface Card** (`{colors.surface-card}` — #FAF7F0): Same bone tone, used specifically for feature/ensemble/value cards.
- **Surface Cream Strong** (`{colors.surface-cream-strong}` — #E5DECC): Strongest-cream variant for selected category tabs and emphasized bands.
- **Surface Dark / Navy** (`{colors.surface-dark}` — #1B3A6B): Hero inversions, concert announcement cards, footer. The dominant dark surface — same hex as primary, used at scale.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #234277): Elevated panels inside navy bands.
- **Surface Dark Soft** (`{colors.surface-dark-soft}` — #0B2540): Deepest navy, used for footer base and ink text.
- **Hairline** (`{colors.hairline}` — #D8D0BD): The 1px border tone on parchment surfaces.
- **Hairline Soft** (`{colors.hairline-soft}` — #E5DECC): Barely-visible divider, used on card borders — almost invisible; the surface-tone shift carries the lift, not the line.

### Text
- **Ink** (`{colors.ink}` — #0B2540): All headlines and primary text. Deep navy, not black.
- **Body Strong** (`{colors.body-strong}` — #1B3A6B): Emphasized paragraphs, pull quotes.
- **Body** (`{colors.body}` — #33455C): Default running-text color.
- **Muted** (`{colors.muted}` — #5C6B80): Sub-headings, breadcrumbs, secondary labels.
- **Muted Soft** (`{colors.muted-soft}` — #8A95A6): Captions, fine-print, footer-adjacent text.
- **On Primary** (`{colors.on-primary}` — #FFFFFF): Text on navy or coral buttons.
- **On Dark** (`{colors.on-dark}` — #F1ECDF): Parchment-tinted white used on navy surfaces (echoes the canvas tone, never pure white).
- **On Dark Soft** (`{colors.on-dark-soft}` — #C5D5E5): Footer body text, secondary labels on navy.

### Semantic
- **Success** (`{colors.success}` — #4A9D6E): Confirmation states (e.g. "application submitted").
- **Warning** (`{colors.warning}` — #C98A2C): Rare — schedule conflicts, capacity warnings.
- **Error** (`{colors.error}` — #B6433F): Form validation errors.

## Typography

### Font Family
The system runs **Roboto** (400/500/700) for every Latin run and **Sarabun** (400/500/700) for every Thai run. Both render mixed Thai+English bodies cleanly when stacked: `font-family: "Roboto", "Sarabun", system-ui` — Sarabun's Thai glyphs activate automatically by unicode-range while Latin falls through to Roboto.

The split is **not** display-vs-body the way Claude's Copernicus/StyreneB split works — it's **script-vs-script**. Both Thai and English headlines use the same weight (700) and the same visual register; neither script is treated as "secondary." Thai bodies get a looser line-height (1.7 vs 1.5) purely for diacritic breathing room, not for hierarchy.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 56px | 700 | 1.1 | -0.01em | Homepage hero h1 ("Thai classical, across cultures") |
| `{typography.display-lg}` | 40px | 700 | 1.15 | -0.01em | Section heads, concert titles |
| `{typography.display-md}` | 32px | 700 | 1.2 | -0.005em | Sub-section heads, ensemble names |
| `{typography.display-sm}` | 24px | 700 | 1.25 | 0 | Callout headlines, card titles in CTA bands |
| `{typography.title-lg}` | 20px | 500 | 1.3 | 0 | Pricing/fee labels, modal headers |
| `{typography.title-md}` | 18px | 500 | 1.4 | 0 | Feature/ensemble card titles |
| `{typography.title-sm}` | 16px | 500 | 1.4 | 0 | Member bio names, list labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default English running-text |
| `{typography.body-md-thai}` | 16px | 400 | 1.7 | 0 | Default Thai running-text — looser leading |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, instrument tags |
| `{typography.eyebrow-uppercase}` | 12px | 700 | 1.4 | 1.5px | Section eyebrows (one per section, max) |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Display sizes use weight 700 (bold), never 400 — this is the system's clearest departure from a Claude-style editorial-serif voice: PETRAband's confidence comes from a bold sans, not a literary serif. Negative tracking (-0.005 to -0.01em) keeps large Roboto from feeling loose.

Body type stays weight 400 for paragraphs, 500 for labels. **No exclamation marks, no all-caps shouting outside the one-per-section eyebrow label.** Bilingual content is never interleaved inside a single sentence — each language gets its own line, or the two are joined with a middle-dot `·` (a typographic character, not decoration).

### Note on Font Coverage
The kit currently ships Roboto 400 (Latin only) and the full Sarabun family at 400/500/700 (Latin + Thai). **Roboto 500 and 700 woff2 files are not yet sourced** — until they arrive, Roboto headlines should use CSS `font-weight: 700` for synthetic bolding, which is visually acceptable for Roboto but should be swapped for the real static weight files as soon as available.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px (desktop) / `{spacing.section-mobile}` 64px (mobile).
- **Card internal padding:** `{spacing.lg}`–`{spacing.xl}` (24–32px) for feature/ensemble/value cards; `{spacing.xl}` (32px) for concert/CTA cards.
- **Callout / CTA bands:** `{spacing.xxl}` (48px) inside coral callout cards; 64px inside the larger dark CTA band.

### Grid & Container
- **Max content width:** 1200px centered.
- **Grid:** 12-column, 24px gutter, 80px outer padding desktop / 24px mobile.
- **Hero:** often a 6/6 split — h1 + sub-headline + CTA row left, hero photo card or ensemble showcase right.
- **Bilingual stacking rule:** when Thai+English appear stacked in any layout, **Thai goes first** — this is a hard rule, not a style preference, since PETRAband is a Thai brand by primary audience.
- **Feature/ensemble card grids:** 4-up at desktop (Piphat / Khrueang Sai / Hybrid / Vocal), 2-up tablet, 1-up mobile.

### Whitespace Philosophy
The parchment canvas + bold sans headlines + generous card padding create a **badge-stamped, confident pacing** — closer to a printed concert program than a tech marketing page. Whitespace between bands stays uniform at 96px desktop; whitespace inside cards is generous (24–32px) so Thai diacritics and bilingual pairs have room to breathe.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands |
| Soft hairline | 1px `{colors.hairline-soft}` border, almost invisible | Cards on parchment — the surface-tone shift carries the lift, not the line |
| Bone card | `{colors.surface-card}` background — no shadow | Feature, ensemble, value cards |
| Navy plate | `{colors.surface-dark}` background — no shadow | Concert announcement cards, hero inversions, footer |
| Accent border | 1.5px navy or coral border | The one element per page needing emphasis — quote pulls, gallery surrounds |
| Modal scrim | `rgba(11,37,64,0.42)` + `backdrop-filter: blur(8px)` | The **only** acceptable shadow-like effect in the entire system |

The elevation philosophy is **printed, not floating** — the system explicitly rejects drop shadows everywhere except the modal scrim. A ship doesn't bounce and a badge doesn't float; depth comes from surface-tone shift (parchment → bone → white → navy) and hairline borders only.

### Decorative Depth
- The circular longship-and-wave mark appears as the wordmark prefix and may recur as a small content marker; clear space = height of the "P" on all sides.
- Wave-band SVG dividers (stacked-curve paths) separate parchment and navy bands — used only as section dividers, **never as a page background**.
- No textures, no repeating patterns — the logo already provides ornamentation.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reserved for tiny inline accents |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 10px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 16px | Content cards (feature, ensemble, value, concert) |
| `{rounded.xl}` | 24px | Hero illustration/photo container, the apply modal |
| `{rounded.pill}` | 9999px | Badge pills, instrument chips |
| `{rounded.full}` | 9999px / 50% | Avatars, the logo itself |

**Never sharp corners anywhere in the system.** The logo is a circle; every container honors that lineage.

### Photography & Illustrations
PETRAband leans on **real photography** over illustration wherever possible — warm, slightly grainy, oceanic or craft-focused (rope, wood, paper, hands, weathered metal; close-ups of ระนาด, ขิม, ซอ with hands). Where real photography isn't yet available, the UI kit uses explicit `[Placeholder photo]` tiles rather than stock-business-meeting imagery or generic college-life stock. No gradients, no hand-drawn line-art mascots. Avatars crop to perfect circles.

## Components

### Top Navigation

**`top-nav`** — Parchment nav bar pinned to the top of every page. 64px tall, `{colors.canvas}` background. Carries the circular longship mark + "PETRAband" wordmark at left, primary menu (Concerts, Ensembles, About, Join) center-left, right-side cluster with a text-link and a `{component.button-primary}` ("สมัครเป็นสมาชิก · Join the band", navy). Menu items in `{typography.nav-link}`.

### Buttons

**`button-primary`** — The default navy CTA. Background `{colors.primary}` (#1B3A6B), text white, type `{typography.button}`, padding 12×20px, height 40px, rounded `{rounded.md}` (10px). Active state darkens to `{colors.primary-active}` (#152E55).

**`button-coral`** — The system's scarce accent button — used once per page maximum, for the single highest-priority CTA (e.g. the hero's "Join the band"). Background `{colors.accent-coral}` (#DD5085), same metrics as primary.

**`button-secondary`** — Parchment button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border.

**`button-secondary-on-dark`** — Used over `{colors.surface-dark}` cards. Background `{colors.surface-dark-elevated}` (#234277), text `{colors.on-dark}`. Never inverts to a light secondary on navy.

**`button-text-link`** / **`button-icon-circular`** — Inline text button and 36px circular icon button (carousel arrows, share), both on `{colors.canvas}` background with hairline border.

**`text-link`** — Inline body links in `{colors.accent-coral}` — the coral inline link is one of the system's most distinctive small details, mirroring how sparingly coral is used elsewhere.

### Cards & Containers

**`hero-band`** / **`hero-band-inverted`** — Parchment or navy-inverted hero, 6-6 grid: h1 + sub-headline + button row left, hero photo/ensemble card right. Vertical padding `{spacing.section}` (96px).

**`feature-card`** — Bone background (`{colors.surface-card}`), rounded `{rounded.lg}`, padding 24px, soft hairline border. Carries an icon, `{typography.title-md}` headline, body description.

**`ensemble-card`** — Used for the four ensemble types (Piphat / Khrueang Sai / Hybrid / Vocal). Parchment background with a slightly stronger hairline border than feature-card, signaling it's a distinct, browsable category rather than a passive feature explanation.

**`concert-card-dark`** — Navy card announcing an upcoming concert or program. Background `{colors.surface-dark}`, padding 32px, rounded `{rounded.lg}`. Carries concert title in `{typography.title-md}`, date/venue in `{typography.body-sm}`, and a coral or cream-button CTA.

**`value-card`** — Used for the four club values (Harmony · Passion · Creativity · Love for Thai music). Bone background, padding 24px, rounded `{rounded.lg}`.

**`callout-card-coral`** — A full-bleed coral card for a single major CTA moment — the **one** place coral is allowed to dominate a whole surface rather than accent it. Background `{colors.accent-coral}`, padding 48px, rounded `{rounded.lg}`. The CTA inside uses an inverted cream/canvas button.

**`member-bio-card`** — Bone background, padding 20px, rounded `{rounded.lg}`. Carries a circular avatar, the member's full Thai name first with transliterated English in parens, instrument, and year (e.g. "ลำดวน — ระนาดเอก · 4th-year BAcc"). **No left-accent border bars** — that's web-tropey and clashes with the badge aesthetic.

### Inputs & Forms

**`text-input`** / **`text-input-focused`** — Bone background (`{colors.surface-soft}`), 1px hairline border, rounded `{rounded.md}` (10px), height 40px. Focus state shifts the border to `{colors.accent-coral}` with a 3px coral outline — not a glow, an outline.

**`apply-modal`** — The working "Apply" modal with an instrument picker. Bone background, rounded `{rounded.xl}` (24px), padding 32px. Sits over a navy scrim (`rgba(11,37,64,0.42)` + `blur(8px)`) — the system's only sanctioned shadow-like effect.

### Tags / Badges

**`badge-pill`** — Instrument or category tag. Background `{colors.surface-cream-strong}`, type `{typography.caption}`, rounded `{rounded.pill}`, padding 4×12px.

**`badge-coral`** — Reserved for genuinely new/featured flags ("New", "Featured ensemble"). Background `{colors.accent-coral}`, type `{typography.eyebrow-uppercase}`, rounded `{rounded.pill}`.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Used to filter concerts or ensembles. Inactive: transparent, `{colors.muted}` text. Active: `{colors.surface-cream-strong}` background, `{colors.ink}` text.

### CTA / Footer

**`cta-band-coral`** — Pre-footer "Join the band" CTA. Full-width coral fill, white type, rounded `{rounded.lg}`, padding 64px. Headline still bold Roboto/Sarabun at `{typography.display-sm}`.

**`cta-band-dark`** — Alternative pre-footer band, e.g. before a concert listing page. Navy background, `{colors.on-dark}` text, padding 64px.

**`footer`** — Navy footer closing every page. Background `{colors.surface-dark}` (#1B3A6B), text `{colors.on-dark-soft}`. Link columns for Concerts / Ensembles / About / Contact. The circular mark + "PETRAband" wordmark sits at the top in `{colors.on-dark}`. The footer never inverts.

## Do's and Don'ts

### Do
- Anchor every page on the parchment canvas. The cream is structural — the coin the badge is stamped on — not a decorative tint to swap for "modern" white.
- Use bold Roboto/Sarabun (700, negative tracking) for every display headline. Keep both scripts at the same visual weight — neither is secondary.
- Reserve `{colors.accent-coral}` for exactly one beat per layout — a ribbon, a focus ring, one CTA, one full-bleed callout card. Never two corals in one viewport.
- Use real photography (rehearsals, instruments, hands) over illustration wherever it exists; use explicit `[Placeholder photo]` tiles, never generic stock, where it doesn't.
- Stack Thai before English in bilingual layouts. Separate scripts onto different lines or join with `·` — never interleave mid-sentence.
- Mention the faculty affiliation and the hybrid-music angle wherever contextually relevant — both are core identity, not footnotes.
- Apply `{spacing.section}` (96px desktop / 64px mobile) between major bands.

### Don't
- Don't use pure white for canvas. Parchment is the brand.
- Don't use Roboto/Sarabun at weight 400 for display headlines — the system's confidence comes from bold weight, not size alone.
- Don't introduce drop shadows anywhere except the modal scrim. Elevation is surface-tone + hairline only.
- Don't put coral on more than one element per viewport. It's scarce by design.
- Don't use sharp corners anywhere — round everything per the radius scale.
- Don't add left-accent border-bar cards — it's web-tropey and breaks the badge-craft feel.
- Don't use emoji or unicode symbol art in copy or UI. The middle-dot `·` is the only allowed typographic separator.
- Don't use exclamation marks or all-caps shouting outside the one-per-section eyebrow label.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 56→32px; hero photo/ensemble card stacks below content; feature/ensemble grids 1-up; pricing/fee info 1-up; footer columns → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; feature/ensemble cards 2-up |
| Desktop | 1024–1440px | Full top-nav; 4-up ensemble cards; 3–4-up feature cards |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px |

### Touch Targets
- `{component.button-primary}` / `{component.button-coral}` at minimum 40×40px.
- `{component.button-icon-circular}` at exactly 36×36px.
- `{component.text-input}` height is 40px.
- Member bio and ensemble cards have a tappable full-card area; effective tap area exceeds 44px.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as a full-screen parchment sheet.
- Hero band's 6-6 grid collapses to single-column on mobile — headline + sub-head + buttons first, photo/ensemble card below.
- Feature/ensemble grids reduce columns rather than scaling cards down.
- The apply modal becomes full-screen on mobile rather than a centered floating card.

### Image Behavior
- Hero and concert photography scales proportionally; crops stay centered on faces/instruments rather than stretching.
- Avatar photos in member bios crop to circles at every breakpoint.
- Wave-band SVG dividers thin and simplify on mobile rather than disappearing.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.ensemble-card}`, `{component.concert-card-dark}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`, `-inverted`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover beyond what's encoded. Default and Active/Pressed/Focused states only — no scale-ups, no bounces, no springs (a ship doesn't bounce).
5. Display headlines stay Roboto/Sarabun bold (700) with tight tracking. The split is script-vs-script, not display-vs-body — keep both scripts visually equal.
6. Parchment + navy + coral is the trinity. Coral stays scarce — don't introduce a fourth surface tone and don't let coral creep beyond one beat per layout.
7. Thai goes first in any stacked bilingual pairing. This is a content rule, not just a visual one.

## Known Gaps

- Roboto is currently only sourced at weight 400 (Latin). Weights 500/700 are not yet available as woff2 — headlines should use CSS synthetic bold until the real static files are supplied.
- The master logo exists only as one transparent PNG (4500×4500). No SVG master, single-color navy lockup, reversed-parchment lockup, or horizontal wordmark variant exists yet.
- No real performance/rehearsal photography exists yet — the UI kit ships with `[Placeholder photo]` tiles. Highest-impact need: 8–12 photos of rehearsals, performances, and instrument close-ups.
- The Thai copy throughout the system was written by inference, not yet reviewed by a native speaker for tone.
- No real concert names, member bios, or program notes exist yet — current examples in any UI kit built from this system are illustrative only.
- Whether PETRAband needs to co-brand with Chulalongkorn or the Faculty (logo lockup, color override) on official materials is unconfirmed — institutional guidelines have not been supplied.
- Custom iconography is not yet commissioned; the system currently substitutes Lucide (music- and voyage-themed glyphs) pending a bespoke set.
