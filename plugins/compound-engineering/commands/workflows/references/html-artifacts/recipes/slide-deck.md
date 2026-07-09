# Recipe: `slide-deck`

- **Family:** research-strategy
- **Type:** deck
- **Tags:** narrative, presentation, sections

**Intent:** Full-bleed section-per-slide narrative deck with a progress rail.

## When to select this recipe

The artifact's content is meant to be read/presented one idea at a time, in sequence (a pitch, a narrative walkthrough) rather than skimmed as a single scrollable page.

## Primitives composed

- One full-viewport-height `<section class="slide">` per island content unit, `scroll-snap-type: y mandatory` for slide-by-slide scrolling (no JS carousel library needed).
- A thin progress rail (`<nav class="slide-rail">`) — the TOC primitive re-skinned as a vertical dot/segment indicator instead of a link list.
- Exporters remain available (fixed header, not per-slide).

## Section skeleton

1. Title slide.
2. One slide per narrative beat.
3. Closing/summary slide.

## Island fields this recipe projects

`ext.deck.slides[]` (`{ heading, body, callout }`) — bespoke, island-backed. If the underlying command's fixed-core already has Tier-3 prose sections that map 1:1 to slides (e.g. problem/user-story/architecture), prefer projecting those directly instead of duplicating them into `ext`.

## Bespoke-drafting note

`scroll-snap` degrades gracefully to plain scrolling in any browser that doesn't support it — never gate the content behind a JS feature-detect; CSS-only progressive enhancement keeps this dependency-free.
