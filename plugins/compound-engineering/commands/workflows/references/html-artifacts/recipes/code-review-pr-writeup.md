# Recipe: `code-review-pr-writeup`

- **Family:** code
- **Type:** review
- **Tags:** diff, comments, pr

**Intent:** Diff-rows + comment-bubble writeup of a reviewed change set — the human-readable counterpart to a PR review.

## When to select this recipe

The artifact's content is a set of reviewed diff hunks with reviewer commentary attached to specific lines, plus an overall verdict.

## Primitives composed

- Diff-rows (`diff-row--added` / `diff-row--removed`) per changed line or hunk.
- Comment bubbles anchored beside the diff-row they annotate.
- Stat-cards for aggregate counts (files changed, findings by severity).
- TOC linking to one section per reviewed file.
- The standard token layer, theme toggle, and three exporters.

## Section skeleton

1. Verdict summary (stat-cards: approve/changes-requested, findings by severity).
2. One section per file: diff-rows with inline comment bubbles.
3. Overall recommendation prose.

## Island fields this recipe projects

Uses the fixed-core `slices[]`/`ext{}` shape from whichever command produced the review data. Diff hunks and comments are bespoke content with no fixed-core home — they belong in `ext.review.files[].hunks[]` with island backing (never HTML-only prose).

## Bespoke-drafting note

If the diff granularity doesn't match (e.g. whole-file verdicts only, no line-level comments), drop the comment-bubble layer and keep stat-cards + a plain per-file verdict list.
