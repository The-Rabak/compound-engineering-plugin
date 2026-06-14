---
{}
---

# Shared E2E Testing Contract

This reference is the single source of truth for what a real end-to-end (e2e) test is, how it is
designed, how it is built, and how it is audited across the workflow chain. It complements
`commands/workflows/references/tdd-evidence-contract.md`: that contract owns the `Red`/`Green`/`Post-Refactor Green`
evidence semantics; **this** contract owns what makes an e2e test *real* and how to prove it.

## The load-bearing principle (non-negotiable)

**E2E means E2E.** Real infrastructure, real APIs, real application logic paths. The deployed or
running app is driven over its real transport against real infra. There is **no mocking, faking,
or stubbing in e2e paths** unless it is absolutely unavoidable AND explicitly justified with
`replacement_evidence`.

**When the app is not yet implemented to satisfy a test's assertions, the test MUST FAIL —
spectacularly and loudly — and stay failing (RED) until the app is built to satisfy it.** A test
must never be massaged into green. Real e2e exists to tell the truth about whether the app works
end to end; a green checkmark is not the goal, an honest verdict is. A test that cannot fail
honestly proves nothing.

This is the entire source of an e2e suite's brutality and efficacy. Fake embedders, hardcoded
`Passed`, mocked-in missing pieces, and fixed `sleep()` calls all keep a suite green while the
real app is broken — exactly the failure this contract exists to prevent. This principle aligns
with the machine-wide fail-loud / no-stub rule.

## Real-or-fail-spectacularly

- An e2e test whose assertions the app cannot yet satisfy MUST fail loudly and remain RED until
  the app is built to satisfy it.
- Forcing such a test green — by mocking the missing piece, weakening the assertion, lowering a
  threshold, narrowing the scenario, or catching-and-passing — is a **P1 violation, not a fix**.
- Green is earned by a working app, never by softening the test.
- Tests-ahead-of-capability are legitimate and encouraged when honestly gated (e.g. marked
  `ignore`/`skip` with a precise gap message) and written to fail RED the moment they run.

## What real e2e means

- Drive the **deployed / running app** over its **real transport** (HTTP, RPC, CLI, UI, message
  bus). Never substitute an in-process router, a `from_environment`/in-test app construction, or a
  unit-test seam for the deployed app.
- The app under test is the artifact you actually ship. If you cannot reach the real app, **fail
  loud** — do not fall back to an in-memory simulation.

## No fakes in e2e

- Zero stubs, mocks, fakes, synthetic data, or in-memory simulation in e2e logic paths.
- The **only** exception is a real dependency that is genuinely impossible to exercise safely
  (e.g. a destructive or irreversible third-party side effect). Even then it must be:
  explicitly justified in `tdd.exceptions` with `replacement_evidence`, scoped as narrowly as
  possible, and never a default convenience.
- Fakes are allowed **only** in unit tests, behind the language's test-only gating. A test-only
  fake must never become the only/default production or e2e implementation.

## Real infra, real data, real faults

- Use real datastores, real services, and real model/API calls — not in-memory or deterministic
  stand-ins.
- A "crash" is a real process/container kill. "Drift" or "corruption" is produced by a real
  interruption, never hand-injected synthetic rows/points/vectors.

## Poll, don't sleep

- Wait on real conditions with bounded pollers that have a deadline and a diagnostic timeout
  message. Never stand a fixed `sleep()` in for polling a real condition.
- Prefer **multi-condition convergence**: assert the underlying state advanced AND the served API
  reflects it, not a single proxy signal.

## No hardcoded passes

- Every assertion derives pass/fail from a live, observed value.
- A scenario that asserts nothing FAILS by construction — "no contract assertions recorded" means
  the scenario proved nothing.
- Missing output, `NoMatch`, a timeout, or a degraded fallback is never silently counted as
  success. Degraded state must be surfaced and asserted on explicitly.

## Observe white-box, read-only

- Snapshot the backing stores/services at each stage to assert ground truth.
- Observation must never mutate app state.

## Cover the full loop and the failure modes

- Exercise the full loop across every seam: write → event → propagate → read.
- Cover failure modes, not just the happy path: concurrency/stress, crash-and-recover, store
  drift/inconsistency, backlog replay, cold boot/readiness honesty, resource cleanup on
  panic/unwind, network timeouts and partial failures.

## Auditable runs

- Emit per-run, per-stage durable logs capturing full inputs, outputs, and infra snapshots.
- Scope artifacts per-run so stale output cannot contaminate a run.
- Keep evidence on both pass and fail. Failure messages should debug themselves (embed the exact
  log/grep/CLI command to triage), and tests should reference the regression/issue they guard.

## Honest naming and human-gated infra

- A test named "live" / "e2e" must be live and end-to-end. Naming must not overclaim.
- Never edit infra, compose files, migrations, or secrets to force a pass, and never lower a
  threshold to turn a real failure green.

## Runtime stack and environments

- E2E must be defined against the declared runtime stack across **local**, **QA**, and **prod**
  (see the `## Runtime Stack & Environments` plan section). Each scenario names which environment
  it runs in and how the real app is reached there (entry point, services/datastores, transport).
- Suites are structured around the actually-running app infra, not an idealized abstraction of it.

## No-runtime-surface exception (the only acceptable "no e2e")

- If there is genuinely no runtime surface to drive (a pure library, a config/asset repo), record
  an explicit, justified N/A in `tdd.exceptions` with `replacement_evidence` describing what does
  prove the behavior instead.
- Silent skipping of e2e is forbidden. Absence of e2e is acceptable only when it is declared and
  justified, never when it is merely omitted.

## Review gate classifications

When auditing e2e, classify findings exactly this way (cite file:line and the concrete reason):

- **Fake-in-e2e** — a stub/mock/fake/synthetic-data/in-memory simulation in an e2e path without a
  justified, scoped exception.
- **Mock transport / not-really-e2e** — the test drives an in-process router or test seam instead
  of the deployed app over its real transport.
- **Empty/hardcoded pass** — an assertion that does not derive from a live value, a `Passed`
  with no preceding check, or a scenario that asserts nothing.
- **Sleep-instead-of-poll** — a fixed `sleep()` standing in for polling a real condition.
- **Test-softened-to-pass** — an assertion weakened, a threshold lowered, a scenario narrowed, or
  a failure caught-and-passed to force green instead of fixing the app. P1.
- **Missing failure-mode coverage** — only the happy path is exercised; relevant failure modes
  (concurrency, crash/recover, drift, backlog, cold boot, cleanup) are absent.
- **Unjustified missing e2e** — e2e is absent and there is no justified N/A exception recorded.

Keep audit output terse and evidence-based. An e2e suite that is suspiciously all-green over a
half-built feature is itself a finding worth investigating.
