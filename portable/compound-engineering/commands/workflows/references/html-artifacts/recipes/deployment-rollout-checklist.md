# Recipe: `deployment-rollout-checklist`

- **Family:** infra-ops
- **Type:** checklist
- **Tags:** rollout, go-no-go, verification

**Intent:** Accordion checklist of go/no-go gates for a deployment.

## When to select this recipe

The artifact is a pre-deployment or rollout checklist gating a release.

## Primitives composed

- Single-open accordion, one item per gate category (e.g. "Database migration safety", "Rollback plan", "Monitoring").
- Inline checkbox-styled list items within each accordion panel (rendered as static `<ul>` with a status marker — read-only in v1, no in-page editing).
- Risk/impact table for any items marked blocked/at-risk.

## Section skeleton

1. Overall go/no-go verdict (prominent, near the top).
2. Accordion: one item per gate category, each listing its checks and status.
3. Risk/impact table: only the blocked/at-risk checks.

## Island fields this recipe projects

Checklist gates live in `ext.rollout.gates[]` (`{ category, checks[], status }`) — bespoke content, island-backed.

## Bespoke-drafting note

If every gate is simply "pass," the risk/impact table has no rows — render the accordion alone and skip an empty table rather than showing an empty state that implies missing data.
