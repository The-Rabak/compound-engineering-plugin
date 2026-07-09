# Recipe: `prototype-animation-interaction`

- **Family:** design
- **Type:** prototype
- **Tags:** motion, interaction, states

**Intent:** Clickable interaction-state walkthrough for a motion/prototype spec.

## When to select this recipe

The artifact documents a UI interaction or motion sequence as a series of named states with transition notes.

## Primitives composed

- Tabbed or timeline-ordered state list; clicking a state applies a CSS class that demonstrates the transition (a CSS `transition`/`animation` on a `var(--)`-driven property — no JS animation library).
- Inline SVG for any diagrammatic state illustration.

## Section skeleton

1. One panel per interaction state, in sequence.
2. Transition notes (duration, easing, trigger) as a small table beside each panel.

## Island fields this recipe projects

States/transitions live in `ext.interaction.states[]` (`{ name, description, trigger, duration, easing }`) — bespoke, island-backed.

## Bespoke-drafting note

If the interaction can't be faithfully demonstrated with CSS transitions alone (e.g. it depends on real gesture input), fall back to a static state-by-state description rather than a misleading approximation.
