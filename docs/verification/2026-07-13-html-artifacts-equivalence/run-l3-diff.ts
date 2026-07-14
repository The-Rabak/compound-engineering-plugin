// Durable, re-runnable driver for the v1 L3 (`/workflows:to-issues`) equivalence
// gate. Extracts the plan contract from BOTH arms via the real reader path
// each arm's format requires:
//   - `.html` arm: the SANCTIONED reference reader `extractIslandData()` from
//     `tests/support/island-spec.ts` (unit-tested; never scrapes rendered HTML).
//   - `.md` arm: a legacy frontmatter + section parser written for this gate
//     (there is no shipped `.md` parser module to import -- the legacy path
//     is "parse frontmatter and sections", per `to-issues.md` step 1).
// Then derives the ticket-packet SET from each arm's extracted contract per
// `to-issues.md`'s ticketization rules + `ticket-execution-contract.md`'s
// packet schema, applies the operational oracle (per-arm floor, cross-arm
// equality, normalizer sanity), and prints everything as JSON so the
// evidence doc quotes real, re-checkable output rather than prose.
//
// Run with: bun run docs/verification/2026-07-13-html-artifacts-equivalence/run-l3-diff.ts
import { readFileSync } from "node:fs"
import * as yaml from "js-yaml"
import { extractIslandData } from "../../../tests/support/island-spec.ts"

const FIXTURES = "../../../tests/fixtures/html-artifacts"

// ============================================================
// 1. HTML arm -- sanctioned reference reader (extractIslandData)
// ============================================================
const htmlPath = `${FIXTURES}/representative-plan.html`
const html = readFileSync(new URL(htmlPath, import.meta.url), "utf8")
const htmlResult = extractIslandData(html)
if (!htmlResult.ok) {
  console.error("HTML ARM EXTRACTION FAILED:", htmlResult.error, htmlResult.message)
  process.exit(1)
}
const htmlArm = htmlResult.data as any

// ============================================================
// 2. MD arm -- legacy frontmatter + section parse
// ============================================================
const mdPath = `${FIXTURES}/frozen-premigration-plan.md`
const raw = readFileSync(new URL(mdPath, import.meta.url), "utf8")
const fmMatch = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw)
if (!fmMatch) throw new Error("No frontmatter block found")
const frontmatter = yaml.load(fmMatch[1]) as any
// js-yaml's default schema auto-resolves an unquoted YAML date scalar
// (`date: 2026-07-09`) into a JS `Date` object, which would then serialize
// as "2026-07-09T00:00:00.000Z" -- a parser artifact, not a real plan-content
// difference from the island's plain "2026-07-09" string. Normalize back to
// the same YYYY-MM-DD string shape so this reader-implementation detail
// cannot masquerade as a cross-arm content diff.
if (frontmatter.date instanceof Date) {
  frontmatter.date = frontmatter.date.toISOString().slice(0, 10)
}
// Sentinel appended so the lazy "next section or EOF" lookahead never needs a
// bare `$` -- combined with the `m` flag `^## ` requires, `$` matches before
// ANY line terminator (including the blank line right after a header),
// which would silently capture an empty section without the sentinel.
const body = fmMatch[2] + "\n##  SENTINEL \n"

function section(name: string): string {
  const pattern = new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=\\n## )`, "m")
  const m = pattern.exec(body)
  if (!m) throw new Error(`Section not found: ${name}`)
  return m[1].trim()
}

const problem_narrative = section("Problem Narrative")
const user_story = section("User Story")
const architectural_context = section("Architectural Context")
const specified_scope_contract = section("Specified Scope Contract")
const references = section("References").replace(/^Brainstorm:\s*`([^`]+)`\s*$/, "$1")

const successCriteriaBlock = section("Success Criteria")
const scPattern = /\d+\.\s+\*\*(SC\d+)\s+—\s+[^*]*?:\*\*\s+([\s\S]*?)\s+\*Verification:\s*([\s\S]*?)\*(?=\n|$)/g
const success_criteria: Array<{ id: string; statement: string; verification: string }> = []
let scM: RegExpExecArray | null
while ((scM = scPattern.exec(successCriteriaBlock))) {
  success_criteria.push({ id: scM[1], statement: scM[2].trim(), verification: scM[3].trim() })
}

const e2eBlock = section("Suggested E2E Suite")
const e2ePattern = /-\s+\*\*(E\d+)\*\*\s+—\s+([\s\S]*?)\s+\*\(([^)]+)\)\*/g
const suggested_e2e_suite: Array<{ id: string; title: string; environment: string }> = []
let e2eM: RegExpExecArray | null
while ((e2eM = e2ePattern.exec(e2eBlock))) {
  suggested_e2e_suite.push({ id: e2eM[1], title: e2eM[2].trim(), environment: e2eM[3].trim() })
}

const slicesBlock = section("Execution Slices") + "\n### Slice SENTINEL\n"
const slicePattern = /###\s+Slice\s+(S\d+)\s+—[^\n]*\n([\s\S]*?)(?=\n###\s+Slice)/g
function bulletField(block: string, label: string): string {
  const withSentinel = block + "\n- **SENTINEL:**"
  const pattern = new RegExp(`-\\s+\\*\\*${label}:\\*\\*\\s+([\\s\\S]*?)(?=\\n-\\s+\\*\\*)`)
  const m = pattern.exec(withSentinel)
  if (!m) throw new Error(`Bullet field not found: ${label}`)
  return m[1].trim()
}
function parseBacktickList(text: string): string[] {
  const out: string[] = []
  const p = /`([^`]+)`/g
  let m: RegExpExecArray | null
  while ((m = p.exec(text))) out.push(m[1])
  return out
}
function parseDependsOn(text: string): string[] {
  if (/^none$/i.test(text.trim())) return []
  const bt = parseBacktickList(text)
  return bt.length ? bt : text.split(",").map((s) => s.trim()).filter(Boolean)
}

type Slice = {
  id: string
  feature_home: string
  scope: string
  scope_fence: string
  files: string[]
  depends_on: string[]
  dependency_type: string
  acceptance_criteria: string
  test_command: string
}

const mdSlices: Slice[] = []
let sliceM: RegExpExecArray | null
while ((sliceM = slicePattern.exec(slicesBlock))) {
  const id = sliceM[1]
  const block = sliceM[2]
  mdSlices.push({
    id,
    feature_home: parseBacktickList(bulletField(block, "Feature home"))[0],
    scope: bulletField(block, "Scope"),
    scope_fence: bulletField(block, "Scope fence"),
    files: parseBacktickList(bulletField(block, "Files")),
    depends_on: parseDependsOn(bulletField(block, "Depends on")),
    dependency_type: bulletField(block, "Dependency type"),
    acceptance_criteria: bulletField(block, "Acceptance criteria"),
    test_command: parseBacktickList(bulletField(block, "Test command"))[0],
  })
}

const mdArm = {
  schema_version: 1,
  kind: "plan",
  title: frontmatter.title,
  type: frontmatter.type,
  date: frontmatter.date,
  status: frontmatter.status,
  refs: {
    brainstorm_ref: frontmatter.brainstorm_ref,
    architecture_ref: frontmatter.architecture_ref,
    tickets_ref: frontmatter.tickets_ref,
    source_docs: frontmatter.source_docs,
  },
  execution_shape: frontmatter.execution_shape,
  tdd: frontmatter.tdd,
  runtime_stack: frontmatter.runtime_stack,
  constitution: { version: frontmatter.constitution_version, waivers: frontmatter.constitution_waivers },
  handoff: frontmatter.handoff,
  slices: mdSlices,
  success_criteria,
  suggested_e2e_suite,
  problem_narrative,
  user_story,
  architectural_context,
  specified_scope_contract,
  references,
}

// ============================================================
// 3. Whitespace normalizer + ref-extension normalizer
// ============================================================
function normWs(s: string): string {
  return s.trim().replace(/\s+/g, " ")
}
function normRef(v: string | null): string | null {
  if (v === null) return null
  return v.replace(/\.(md|html)$/i, "")
}

// ============================================================
// 4. Ticket packet derivation (per to-issues.md + ticket-execution-contract.md)
//    One ticket per execution slice -- no split/merge is documented for this
//    feature (3 slices -> 3 tickets). Ticket id = zero-padded "T" + the
//    slice's numeric suffix (S01/S02/S03 -> T01/T02/T03); depends_on
//    translated from slice ids to ticket ids via that same 1:1 mapping.
//    `serves` uses a fixed, arm-independent heuristic keyed only to each
//    slice's own acceptance-criteria content (documented below), applied
//    identically to both arms -- so it cannot itself introduce cross-arm
//    drift, whatever its merits as a ticketization judgment call.
// ============================================================
function sliceIdToTicketId(sliceId: string): string {
  const n = sliceId.replace(/^S/, "")
  return `T${n}`
}

const SERVES_BY_SLICE: Record<string, string[]> = {
  S01: ["SC2"], // toCsv() RFC4180-compliant rows -> spreadsheet-clean output (SC2)
  S02: ["SC1"], // export route is plumbing toward the user-facing export capability (SC1)
  S03: ["SC1"], // Export CSV button is the literal user-facing action SC1's own verification describes
}

function buildTicketPackets(slices: Slice[]) {
  return slices
    .map((s) => {
      const id = sliceIdToTicketId(s.id)
      return {
        id,
        feature_home: s.feature_home,
        files: [...s.files].sort(),
        depends_on: s.depends_on.map(sliceIdToTicketId).sort(),
        dependency_type: s.dependency_type,
        serves: SERVES_BY_SLICE[s.id] ?? [],
        test_command: s.test_command,
        tdd_mode: "inherit", // plan tdd.precedence = plan_overrides_local -> no ticket-level override
        scope_fence: normWs(s.scope_fence),
        acceptance_criteria: normWs(s.acceptance_criteria),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

type TicketPacket = ReturnType<typeof buildTicketPackets>[number]

const htmlTickets = buildTicketPackets(htmlArm.slices)
const mdTickets = buildTicketPackets(mdArm.slices)

function dependencyEdges(tickets: TicketPacket[]) {
  return tickets.flatMap((t) => t.depends_on.map((dep) => `${dep} -> ${t.id} (${t.dependency_type})`)).sort()
}

function batchPartition(tickets: TicketPacket[]) {
  // Conservative batching per to-issues.md: only group when deps are
  // satisfied by earlier batches AND files sets don't overlap; default to
  // sequential singleton batches whenever safe parallelism is unclear. Every
  // ticket here has a hard dependency on the previous one, so the only
  // valid partition is one ticket per batch.
  const batches: string[][] = []
  const done = new Set<string>()
  const remaining = [...tickets]
  while (remaining.length > 0) {
    const ready = remaining.filter((t) => t.depends_on.every((d) => done.has(d)))
    const next = ready[0]
    batches.push([next.id])
    done.add(next.id)
    remaining.splice(remaining.indexOf(next), 1)
  }
  return batches
}

// ============================================================
// 5. Per-arm floor check
// ============================================================
function floorCheck(armName: string, slices: Slice[], tickets: TicketPacket[]) {
  const ticketCountOk = tickets.length >= slices.length
  const nonEmptyChecks = tickets.map((t) => ({
    id: t.id,
    scope_fence_nonempty: t.scope_fence.length > 0,
    acceptance_criteria_nonempty: t.acceptance_criteria.length > 0,
  }))
  const allNonEmpty = nonEmptyChecks.every((c) => c.scope_fence_nonempty && c.acceptance_criteria_nonempty)
  return {
    arm: armName,
    slice_count: slices.length,
    ticket_count: tickets.length,
    ticket_count_meets_floor: ticketCountOk,
    per_ticket_nonempty: nonEmptyChecks,
    all_nonempty: allNonEmpty,
    floor_pass: ticketCountOk && allNonEmpty,
  }
}

const htmlFloor = floorCheck("html", htmlArm.slices, htmlTickets)
const mdFloor = floorCheck("md", mdArm.slices, mdTickets)

// ============================================================
// 6. Cross-arm field-by-field diff (packet fields, excluding the
//    lenient success_criteria[].verification prose field)
// ============================================================
type Diff = { field: string; html: unknown; md: unknown }
const diffs: Diff[] = []

function cmp(field: string, a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ field, html: a, md: b })
}

for (let i = 0; i < Math.max(htmlTickets.length, mdTickets.length); i++) {
  const h = htmlTickets[i]
  const m = mdTickets[i]
  if (!h || !m) {
    diffs.push({ field: `ticket[${i}] presence`, html: h?.id ?? "MISSING", md: m?.id ?? "MISSING" })
    continue
  }
  cmp(`${h.id}.id`, h.id, m.id)
  cmp(`${h.id}.feature_home`, h.feature_home, m.feature_home)
  cmp(`${h.id}.files`, h.files, m.files)
  cmp(`${h.id}.depends_on`, h.depends_on, m.depends_on)
  cmp(`${h.id}.dependency_type`, h.dependency_type, m.dependency_type)
  cmp(`${h.id}.serves`, h.serves, m.serves)
  cmp(`${h.id}.test_command`, h.test_command, m.test_command)
  cmp(`${h.id}.tdd_mode`, h.tdd_mode, m.tdd_mode)
  cmp(`${h.id}.scope_fence`, h.scope_fence, m.scope_fence)
  cmp(`${h.id}.acceptance_criteria`, h.acceptance_criteria, m.acceptance_criteria)
}

cmp("ticket_id_set (sorted)", htmlTickets.map((t) => t.id).sort(), mdTickets.map((t) => t.id).sort())
cmp("dependency_edges", dependencyEdges(htmlTickets), dependencyEdges(mdTickets))
cmp("batch_partition", batchPartition(htmlTickets), batchPartition(mdTickets))

// success_criteria: strict on {id, statement}; verification prose reported
// separately and treated leniently per the gate's stated exception.
const scDiffs: Array<{ id: string; html_statement: string; md_statement: string; statement_match: boolean }> = []
const verificationNotes: Array<{ id: string; html_verification: string; md_verification: string; match: boolean }> = []
for (let i = 0; i < Math.max(htmlArm.success_criteria.length, mdArm.success_criteria.length); i++) {
  const h = htmlArm.success_criteria[i]
  const m = mdArm.success_criteria[i]
  scDiffs.push({
    id: h?.id ?? m?.id,
    html_statement: h?.statement,
    md_statement: m?.statement,
    statement_match: h?.id === m?.id && h?.statement === m?.statement,
  })
  verificationNotes.push({
    id: h?.id ?? m?.id,
    html_verification: h?.verification,
    md_verification: m?.verification,
    match: h?.verification === m?.verification,
  })
}
const scStrictFail = scDiffs.filter((d) => !d.statement_match)

// refs normalizer check: does the .(md|html) normalizer actually change
// anything on THIS data?
const refFields: Array<{ field: string; html: string | null; md: string | null }> = [
  { field: "brainstorm_ref", html: htmlArm.refs.brainstorm_ref, md: mdArm.refs.brainstorm_ref },
  { field: "architecture_ref", html: htmlArm.refs.architecture_ref, md: mdArm.refs.architecture_ref },
  { field: "tickets_ref", html: htmlArm.refs.tickets_ref, md: mdArm.refs.tickets_ref },
]
const refNormalizerReport = refFields.map((r) => ({
  field: r.field,
  html_raw: r.html,
  md_raw: r.md,
  html_normalized: normRef(r.html),
  md_normalized: normRef(r.md),
  raw_equal: r.html === r.md,
  normalized_equal: normRef(r.html) === normRef(r.md),
}))

// Synthetic proof the normalizer is not a no-op (independent of whether this
// fixture's own ref values happen to diverge).
const syntheticProof = [
  { input: "docs/tickets/2026-07-09-csv-export/index.html", output: normRef("docs/tickets/2026-07-09-csv-export/index.html") },
  { input: "docs/tickets/2026-07-09-csv-export/index.md", output: normRef("docs/tickets/2026-07-09-csv-export/index.md") },
]

// ============================================================
// 7. Output everything as JSON for the evidence doc to quote verbatim
// ============================================================
console.log(
  JSON.stringify(
    {
      htmlArm,
      mdArm,
      htmlTickets,
      mdTickets,
      htmlFloor,
      mdFloor,
      dependencyEdgesHtml: dependencyEdges(htmlTickets),
      dependencyEdgesMd: dependencyEdges(mdTickets),
      batchPartitionHtml: batchPartition(htmlTickets),
      batchPartitionMd: batchPartition(mdTickets),
      diffs,
      scDiffs,
      scStrictFail,
      verificationNotes,
      refNormalizerReport,
      syntheticProof,
    },
    null,
    2,
  ),
)
