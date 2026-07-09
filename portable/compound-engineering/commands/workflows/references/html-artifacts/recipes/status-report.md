# Recipe: `status-report`

- **Family:** infra-ops
- **Type:** report
- **Tags:** metrics, health, weekly

**Intent:** Stat-card health/metrics snapshot for a recurring status update.

## When to select this recipe

The artifact is a point-in-time health/metrics snapshot (a weekly/sprint status update, an ops health check).

## Primitives composed

- Stat-cards for headline metrics (one per KPI).
- A compact timeline of notable events since the last report.
- Token layer, theme toggle, three exporters (copy-as-markdown is especially valuable here for pasting into chat/email).

## Section skeleton

1. Stat-cards: headline metrics with trend direction.
2. Timeline: notable events this period.
3. Narrative summary (Tier-3-style prose).

## Island fields this recipe projects

Metrics/events live in `ext.status_report.metrics[]` / `ext.status_report.events[]` — no fixed-core home; the narrative summary can reuse an existing Tier-3 prose field if the artifact already carries one (e.g. `problem_narrative`-shaped context), otherwise it is bespoke `ext` content.

## Bespoke-drafting note

If there is only one metric worth reporting, skip the stat-card grid entirely and lead with the narrative — a one-card grid reads as padding.
