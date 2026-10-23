---
name: Civic Sentra
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#42474b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#73787c'
  outline-variant: '#c2c7cb'
  surface-tint: '#4a6270'
  primary: '#001824'
  on-primary: '#ffffff'
  primary-container: '#142d3a'
  on-primary-container: '#7c95a5'
  inverse-primary: '#b1cadb'
  secondary: '#006874'
  on-secondary: '#ffffff'
  secondary-container: '#95f1ff'
  on-secondary-container: '#006f7b'
  tertiary: '#001a14'
  on-tertiary: '#ffffff'
  tertiary-container: '#003127'
  on-tertiary-container: '#1ea488'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde6f7'
  primary-fixed-dim: '#b1cadb'
  on-primary-fixed: '#031e2b'
  on-primary-fixed-variant: '#324a58'
  secondary-fixed: '#95f1ff'
  secondary-fixed-dim: '#79d4e2'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f57'
  tertiary-fixed: '#82f7d8'
  tertiary-fixed-dim: '#65dabc'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an authoritative, reliable, and highly functional aesthetic tailored for civic intelligence and municipal climate resilience. The interface balances institutional gravity with modern accessibility, instilling confidence across two distinct user segments: active civic authorities monitoring real-time urban vitals, and everyday citizens seeking timely environmental safety advisories.

The visual direction draws from high-utility modern civic-tech and functional dashboard architecture:
- **Clean Structural Precision:** Interfaces prioritize immediate legibility, strict structural alignment, and low cognitive overhead during critical weather and urban risk events.
- **Calm, High-Contrast Palette:** Grounded deep slate-navies, focused marine teals, and soft ivory fields avoid panic while delivering undeniable clarity and authoritative hierarchy.
- **Crisp Data Architecture:** Modular cards, crisp micro-borders, and distinctive status badges synthesize complex sensory telemetry into actionable insights across desktop war rooms and mobile viewports.

## Colors

The palette establishes an institutional, climate-conscious visual ecosystem designed to exceed WCAG AAA standards for legibility:

- **Primary (`#142D3A` - Deep Navy):** The anchor for brand architecture, major navigational framing, primary interactive triggers, and high-emphasis display typography.
- **Secondary (`#087F8C` - Teal):** Expresses active civic intelligence, key dashboard telemetry highlights, focused states, and interactive links.
- **Tertiary (`#16A085` - Emerald):** Denotes resilience, optimal municipal status, environmental safety confirmations, and positive trend vectors.
- **Neutral (`#64748B` - Slate):** Governs secondary prose, auxiliary metadata, structural divider strokes, and disabled form elements.
- **Surface Canvas (`#F8FAF9` - Ivory Tint):** Softens the visual weight of wide-screen dashboards, reducing eye strain during prolonged monitoring sessions.
- **Substrate Surface (`#FFFFFF` - Crisp White):** Dedicated to floating telemetry cards, analytical panels, and interactive modal dialogs.
- **Accent Tints (`#E9F6F2` - Pale Mint):** Provides low-contrast contextual backing for positive badges, selected rows, and informational focus states.
- **Functional Warnings (`#E9A23B` - Amber) & Critical Alerts (`#D94F52` - Crimson):** Reserved strictly for threshold violations, flood/heatwave emergencies, and unacknowledged public escalations.

## Typography

The type system blends the contemporary, approachable structure of Plus Jakarta Sans for top-level headers with the objective, highly legible neutrality of Inter for dense metric matrices, civic logs, and system controls.

- **Plus Jakarta Sans (Headings):** Deployed for view headlines, platform metrics, and module banners. Its balanced geometry maintains human warmth without compromising institutional stability.
- **Inter (Body & Telemetry):** Serves body paragraphs, form fields, tabular sensor readouts, and status chips. Selected for its exceptional glyph distinction, tall x-height, and legibility at sub-pixel and micro sizes.
- **Numeric Rhythm:** When presenting numerical telemetry (such as rainfall, air quality index, or temperature deltas), tabular numerals (`font-feature-settings: 'tnum' 1`) must be enabled to ensure absolute spatial alignment in recurring lists.

## Layout & Spacing

The interface employs a hybrid fluid grid designed around rigorous mathematical multiples of 8px (0.5rem), scaling down to 4px (0.25rem) for micro-alignments in badge indicators and sensor tables.

- **Desktop (12-Column Grid):** Uses `2rem` screen margins with a fluid container capping out at `1440px`. Gutters remain static at `1.5rem` (`24px`) to preserve breathing room between dense charts and telemetry sidebars.
- **Tablet (8-Column Grid):** Screen margins compress to `1.5rem`, while gutters shift to `1rem` (`16px`). Secondary sidebars collapse into toggleable off-canvas sheets.
- **Mobile (4-Column Grid):** Margins drop to `1rem` (`16px`), aligning all operational cards flush to the safe viewport boundaries. Navigation converts into a fixed bottom action bar with persistent alerts pinned to the top viewport edge.
- **Rhythm & Hierarchy:** Interior card padding strictly utilizes `space-md` (`1rem`) on compact views and `space-lg` (`1.5rem`) on desktop analytics modules, keeping information density comfortably high.

## Elevation & Depth

To maintain clarity and institutional authority, this design system rejects heavy or artificial shadows in favor of crisp architectural layering, subtle tonal shifts, and low-contrast surface outlines:

- **Surface Baseline (Level 0):** The primary ivory canvas (`#F8FAF9`) acts as the passive floor.
- **Card Substrates (Level 1):** White panels (`#FFFFFF`) framed by a calibrated `1px` border of `rgba(100, 116, 139, 0.16)`. No shadow is applied under default state, maintaining a clean architectural sheet aesthetic.
- **Floating Controls & Interactive Cards (Level 2):** Applied to active dropdowns, operational cards on hover, and persistent mobile tab bars. Supported by a dual ambient shadow: `0 2px 4px rgba(20, 45, 58, 0.04), 0 8px 16px rgba(20, 45, 58, 0.06)`.
- **Critical Alerts & Modal Overlays (Level 3):** Reserved for live emergency broadcasts, simulated incident reports, and system-level confirmation dialogs. Uses an elevated shadow: `0 12px 32px rgba(20, 45, 58, 0.12)` alongside a dimmed backdrop overlay of `rgba(20, 45, 58, 0.48)` with a `4px` blur.

## Shapes

The design system enforces a soft, structured corner philosophy (Level 1). Elements utilize a foundational radius of `0.25rem` (`4px`) for micro-components such as badges, inputs, and chips, extending to `0.5rem` (`8px`) for cards, alert modules, and modal containers.

This approach prevents the interface from feeling either clinical or juvenile, projecting professional order, structural precision, and institutional reliability.

## Components

### Buttons
- **Primary Action:** Solid Deep Navy (`#142D3A`) fill with crisp white text, `0.25rem` radius, and `space-sm` vertical by `space-md` horizontal padding. Transitions to Teal (`#087F8C`) on hover.
- **Secondary Action:** Outlined with a `1px` solid border (`#087F8C`), white or transparent background, and Teal text. Hover fills with Pale Mint (`#E9F6F2`).
- **Emergency Action:** Critical Red (`#D94F52`) fill, white text, designated solely for civic warnings, incident reports, and simulated drill triggers.

### Status Badges & Chips
- Compact height (`24px`), font scale `label-sm`, uppercase with subtle letter-spacing (`0.05em`).
- **Nominal / Safe:** Pale Mint background (`#E9F6F2`) with Emerald text (`#16A085`) and a matching `1px` subtle outline.
- **Elevated / Warning:** Soft amber tint (`#FEF3C7`) with Amber text (`#B45309`).
- **Severe / Emergency:** Soft crimson tint (`#FEE2E2`) with Critical Red text (`#D94F52`).
- **Interactive Filter Chips:** White background, Slate outline (`#64748B`), turning Deep Navy with Pale Mint active counters when selected.

### Input Fields & Controls
- **Text Inputs & Selects:** Height `40px`, background `#FFFFFF`, border `1px` solid `rgba(100, 116, 139, 0.28)`, text in `#142D3A`. Focus states initiate a `2px` crisp ring in Teal (`#087F8C`) with zero offset.
- **Checkboxes & Radios:** `16px` squared / circular nodes with a `1.5px` border in `#64748B`. Checked state fills with `#087F8C` displaying an optical white check icon.

### Cards & Analytical Panels
- White solid substrate, `0.5rem` border-radius, bounded by a `1px` solid border (`rgba(100, 116, 139, 0.16)`).
- Header row contains explicit category labels (`label-md` in Slate), a bold metric or title (`headline-md` in Deep Navy), and an aligned status badge.
- Inner divisions leverage `1px` border dividers in `#F1F5F9`.

### Interactive Segmented Tabs (Authority vs. Citizen)
- Pill-container housing structured switch controls for citizen and municipal authority personas.
- Subtle Ivory canvas background (`#E2E8F0` tint), with the active tab transitioning to a crisp White card possessing a `1px` border and subtle `0 1px 3px rgba(20, 45, 58, 0.08)` drop shadow.

### Sensor Telemetry Tickers
- Specialized continuous readouts displaying water level sensors, air quality indexing, and micro-grid status.
- Designed with high-density data typography, using colored bullet pings (pulsing dot indicator) next to tabular readouts to convey real-time system heartbeats.