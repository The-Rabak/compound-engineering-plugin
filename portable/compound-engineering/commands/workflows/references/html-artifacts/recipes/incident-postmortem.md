# Recipe: `incident-postmortem`

- **Family:** infra-ops
- **Type:** postmortem
- **Tags:** timeline, root-cause, action-items

**Intent:** Timeline of an incident plus root-cause and action-item table.

## When to select this recipe

The artifact documents a completed incident: what happened, when, why, and what changes as a result.

## Primitives composed

- Timeline (milestone/roadmap primitive) for the incident chronology, with `data-status` marking detection/mitigation/resolution.
- Risk/impact table reused for the action-items table (columns: action, owner, due, status).
- Accordion for supplementary sections (blast radius, customer impact, monitoring gaps).

## Section skeleton

1. Timeline: detection → mitigation → resolution.
2. Root-cause narrative.
3. Action-items table.
4. Accordion: blast radius / customer impact / monitoring gaps.

## Island fields this recipe projects

Incident chronology and action items live in `ext.incident.timeline[]` / `ext.incident.action_items[]` — bespoke content, island-backed.

## Bespoke-drafting note

Never invent a root-cause conclusion the source content doesn't state — if the input is inconclusive, render the timeline and action items and say the root cause is still under investigation, in prose, rather than fabricating certainty.
