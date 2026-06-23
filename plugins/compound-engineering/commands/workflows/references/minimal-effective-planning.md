# Minimal Effective Planning

Use this reference when brainstorming, planning, deepening, or executing workflow plans. The goal is a minimal effective solution: the smallest scoped plan that fully satisfies the user's stated outcome, confirmed decisions, and mandatory project guardrails.

## Scope Hierarchy

Classify every material idea before it enters the executable plan:

1. **explicit request** -- work the user directly asked for.
2. **confirmed brainstorm / grill-me decision** -- work the user validated during discovery, brainstorming, or grilling.
3. **necessary inference** -- work required to satisfy success criteria, TDD/evidence, repo constitution, runtime constraints, or existing architecture.
4. **deferred / non-goal** -- useful ideas that are not required for the current outcome.

Only the first three categories belong in execution packets. Deferred / non-goal items can be recorded as scope boundaries or future considerations, but they should not silently become backlog.

## Complexity Gate

Before adding speculative abstractions, broad migrations, new framework layers, multi-phase hardening, or cross-feature cleanup, write a short complexity gate justification:

- why the simpler option is insufficient
- which requirement, risk, or guardrail requires the complexity now
- why deferring the complexity would harm the current success criteria

If the justification is weak, move the idea to Future Considerations or omit it.

## Lite-Mode Non-Negotiables

Lite or compact planning may reduce ceremony, but it must still preserve:

- WHY linkage through a problem narrative or equivalent purpose statement
- success criteria tied to the requested outcome
- TDD/evidence expectations and any justified exceptions
- execution shape and dependency clarity
- scope fences, including deferred / non-goal items when they matter

Compact is acceptable. Ambiguous, untraceable, or scope-expanding is not.

## Lite-mode inputs

Treat lite mode as explicit user intent, not an inferred downgrade. It may be triggered by `--lite`, "lite", "small", "routine", or equivalent wording that clearly asks for a compact path.

Lite mode should:

- skip broad questionnaires unless the user mentions tickets, docs, Figma, spec files, or other source material
- skip external research unless the topic is high-risk, unfamiliar, or lacks local patterns
- use compact self-checks for low-risk SpecFlow/e2e design while still recording justified evidence expectations

## Lite-mode outputs

Lite-mode plans still emit the same core contract, but in compact form:

- problem narrative or equivalent WHY statement
- user story or concise user outcome
- architectural context
- success criteria
- TDD/evidence contract and justified exceptions
- execution shape
- scope fences and deferred / non-goal items when relevant
- one or a few execution packets

For low-risk small changes, recommend direct `/workflows:work <plan>` after plan creation. Keep `/workflows:architecture`, `/deepen-plan`, and `/workflows:to-issues` available when risk, ambiguity, or coordination needs justify them.
