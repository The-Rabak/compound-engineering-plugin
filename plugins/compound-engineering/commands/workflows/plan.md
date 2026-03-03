---
name: workflows:plan
description: Transform feature descriptions into well-structured project plans following conventions
argument-hint: "[feature description, bug report, or improvement idea]"
---

# Create a plan for a new feature or bug fix

## Introduction

**Note: The current year is 2026.** Use this when dating plans and searching for recent documentation.

Transform feature descriptions, bug reports, or improvement ideas into well-structured markdown files issues that follow project conventions and best practices. This command provides flexible detail levels to match your needs.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to plan? Please describe the feature, bug fix, or improvement you have in mind."

Do not proceed until you have a clear feature description from the user.

### 0. Idea Refinement

**Check if arguments contain a plan or spec file:**

If the feature description (`#$ARGUMENTS`) is or contains a path to a `.md` file (e.g., `docs/plans/some-plan.md`, `spec.md`, `~/notes/feature-plan.md`):

1. Read the file
2. Announce: "Found existing plan/spec: `[file path]`. Using as foundation."
3. Extract: title, problem statement, proposed approach, acceptance criteria, implementation phases, and any existing tasks
4. **Skip idea refinement questions** — the plan already defines WHAT to build
5. **Skip brainstorm check** — an explicit plan supersedes brainstorm discovery
6. Proceed to Step 0.5 to gather any additional project inputs, then to research to validate and enrich the existing plan
7. In Step 2 (Issue Planning), **build upon the existing plan structure** — preserve its sections, fill gaps, add execution-readiness fields (Files, Depends on, Success criteria, Test command) to any tasks that lack them, and enrich with research findings. Do NOT discard or rewrite sections that are already well-defined.

**If arguments are NOT a file path, check for brainstorm output:**

Before asking questions, look for recent brainstorm documents in `docs/brainstorms/` that match this feature:

```bash
ls -la docs/brainstorms/*.md 2>/dev/null | head -10
```

**Relevance criteria:** A brainstorm is relevant if:
- The topic (from filename or YAML frontmatter) semantically matches the feature description
- Created within the last 14 days
- If multiple candidates match, use the most recent one

**If a relevant brainstorm exists:**
1. Read the brainstorm document
2. Announce: "Found brainstorm from [date]: [topic]. Using as context for planning."
3. Extract key decisions, chosen approach, and open questions
4. **Skip the idea refinement questions below** - the brainstorm already answered WHAT to build
5. Use brainstorm decisions as input to the research phase

**If multiple brainstorms could match:**
Use **AskUserQuestion tool** to ask which brainstorm to use, or whether to proceed without one.

**If no brainstorm found (or not relevant), run idea refinement:**

Refine the idea through collaborative dialogue using the **AskUserQuestion tool**:

- Ask questions one at a time to understand the idea fully
- Prefer multiple choice questions when natural options exist
- Focus on understanding: purpose, constraints and success criteria
- Continue until the idea is clear OR user says "proceed"

**Gather signals for research decision.** During refinement, note:

- **User's familiarity**: Do they know the codebase patterns? Are they pointing to examples?
- **User's intent**: Speed vs thoroughness? Exploration vs execution?
- **Topic risk**: Security, payments, external APIs warrant more caution
- **Uncertainty level**: Is the approach clear or open-ended?

**Skip option:** If the feature description is already detailed, offer:
"Your description is clear. Should I proceed with research, or would you like to refine it further?"

### 0.5 Gather Project Inputs

Use the **AskUserQuestion tool** to collect structured project inputs. Ask these 4 questions in sequence:

**Question 1:** "Do you have any project management tickets related to this feature?"
- Options: `["None", "Enter URLs"]`
- If "Enter URLs": Ask user to paste ticket URLs (comma-separated)

**Question 2:** "Do you have any wiki or documentation pages related to this feature?"
- Options: `["None", "Enter URLs"]`
- If "Enter URLs": Ask user to paste documentation URLs (comma-separated)

**Question 3:** "Do you have any Figma designs related to this feature?"
- Options: `["None", "Enter URLs"]`
- If "Enter URLs": Ask user to paste Figma design URLs (comma-separated)

**Question 4:** "Do you have any existing plan, spec, or requirements documents (.md files) to build from?"
- Options: `["None", "Enter file paths"]`
- If "Enter file paths": Ask user to paste file paths (comma-separated, relative or absolute)

**Processing inputs:**

For any non-empty inputs, launch **parallel subagents** to fetch and summarize each document:

- Task fetch-and-summarize(ticket_urls) → Extract ticket title, description, acceptance criteria, status
- Task fetch-and-summarize(doc_urls) → Extract key decisions, requirements, technical context
- Task fetch-and-summarize(figma_urls) → Extract design intent, component structure, interaction patterns
- Task read-and-extract(plan_file_paths) → Read each `.md` file, extract structure (title, problem statement, approach, tasks, acceptance criteria, open questions). Identify which sections are well-defined vs need enrichment.

**Handle `MANUAL_INPUT_NEEDED`:** If a subagent cannot access a URL (authentication required, private resource), use the **AskUserQuestion tool** to ask: "I couldn't access [URL]. Could you paste the relevant content from this document?"

**Consolidate into `project_context` block:**

```markdown
## Project Context (from structured inputs)

### Project Tickets
- [TICKET-123](url): Summary of ticket...

### Documentation
- [Doc Title](url): Key decisions and requirements...

### Figma Designs
- [Design Name](url): Design intent and component overview...

### Existing Plans / Specs
- [filename.md](path): Structure summary, well-defined sections, gaps to fill...
```

**Store source URLs/paths in plan frontmatter** under `source_docs:`:

```yaml
source_docs:
  tickets:
    - https://tracker.example.com/TICKET-123
  docs:
    - https://wiki.example.com/pages/doc-id
  figma:
    - https://figma.com/file/abc123
  plans:
    - docs/specs/existing-feature-spec.md
```

If all three inputs are "None", skip this step and proceed.

## Main Tasks

### 1. Local Research (Always Runs - Parallel)

<thinking>
First, I need to understand the project's conventions, existing patterns, and any documented learnings. This is fast and local - it informs whether external research is needed.
</thinking>

Run these agents **in parallel** to gather local context:

- Task repo-research-analyst(feature_description)
- Task learnings-researcher(feature_description)

**What to look for:**
- **Repo research:** existing patterns, CLAUDE.md guidance, technology familiarity, pattern consistency
- **Learnings:** documented solutions in `docs/solutions/` that might apply (gotchas, patterns, lessons learned)

These findings inform the next step.

### 1.5. Research Decision

Based on signals from Step 0 and findings from Step 1, decide on external research.

**High-risk topics → always research.** Security, payments, external APIs, data privacy. The cost of missing something is too high. This takes precedence over speed signals.

**Strong local context → skip external research.** Codebase has good patterns, CLAUDE.md has guidance, user knows what they want. External research adds little value.

**Uncertainty or unfamiliar territory → research.** User is exploring, codebase has no examples, new technology. External perspective is valuable.

**Announce the decision and proceed.** Brief explanation, then continue. User can redirect if needed.

Examples:
- "Your codebase has solid patterns for this. Proceeding without external research."
- "This involves payment processing, so I'll research current best practices first."

### 1.5b. External Research (Conditional)

**Only run if Step 1.5 indicates external research is valuable.**

Run these agents in parallel:

- Task best-practices-researcher(feature_description)
- Task framework-docs-researcher(feature_description)

### 1.6. Consolidate Research

After all research steps complete, consolidate findings:

- Document relevant file paths from repo research (e.g., `app/Services/ExampleService.php:42`)
- **Include relevant institutional learnings** from `docs/solutions/` (key insights, gotchas to avoid)
- **Include project context** from structured inputs (project tickets, documentation, Figma designs)
- Note external documentation URLs and best practices (if external research was done)
- List related issues or PRs discovered
- Capture CLAUDE.md conventions

**Optional validation:** Briefly summarize findings and ask if anything looks off or missing before proceeding to planning.

### 2. Issue Planning & Structure

<thinking>
Think like a product manager - what would make this issue clear and actionable? Consider multiple perspectives
</thinking>

**Title & Categorization:**

- [ ] Draft clear, searchable issue title using conventional format (e.g., `feat: Add user authentication`, `fix: Cart total calculation`)
- [ ] Determine issue type: enhancement, bug, refactor
- [ ] Convert title to filename: add today's date prefix, strip prefix colon, kebab-case, add `-plan` suffix
  - Example: `feat: Add User Authentication` → `2026-01-21-feat-add-user-authentication-plan.md`
  - Keep it descriptive (3-5 words after prefix) so plans are findable by context

**Stakeholder Analysis:**

- [ ] Identify who will be affected by this issue (end users, developers, operations)
- [ ] Consider implementation complexity and required expertise

**Content Planning:**

- [ ] Choose appropriate detail level based on issue complexity and audience
- [ ] List all necessary sections for the chosen template
- [ ] Gather supporting materials (error logs, screenshots, design mockups)
- [ ] Prepare code examples or reproduction steps if applicable, name the mock filenames in the lists

**Execution Readiness:**

For plans that will be executed via `/workflows:work`, ensure each implementation task includes:
- **Files:** List of files to create or modify
- **Depends on:** Which other tasks must complete first (or "None")
- **Success criteria:** Testable checkboxes that define "done"
- **Test command:** The exact command to verify the task is complete

This structured format enables the `/workflows:work` orchestrator to delegate each task to a focused subagent with clear scope and termination criteria. Plans without this structure will be flagged for refinement before execution begins.

### 3. SpecFlow Analysis

After planning the issue structure, run SpecFlow Analyzer to validate and refine the feature specification:

- Task spec-flow-analyzer(feature_description, research_findings)

**SpecFlow Analyzer Output:**

- [ ] Review SpecFlow analysis results
- [ ] Incorporate any identified gaps or edge cases into the issue
- [ ] Update acceptance criteria based on SpecFlow findings

### 4. Choose Implementation Detail Level

**Important for `/workflows:work` compatibility:** All detail levels can be executed, but the MORE and A LOT levels produce plans with structured execution chunks (per-task success criteria, test commands, file lists) that enable the subagent orchestration model in `/workflows:work`. MINIMAL plans work but may require the orchestrator to decompose tasks further before delegating to subagents.

Select how comprehensive you want the issue to be, simpler is mostly better.

#### 📄 MINIMAL (Quick Issue)

**Best for:** Simple bugs, small improvements, clear features

**Includes:**

- Problem statement or feature description
- Basic acceptance criteria
- Essential context only

**Note:** MINIMAL plans may need to be enriched with per-task success criteria before running `/workflows:work`. The orchestrator can handle this decomposition automatically, but providing structured tasks up front leads to more predictable execution.

**Structure:**

````markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
source_docs:
  tickets: []
  docs: []
  figma: []
  plans: []
---

# [Issue Title]

[Brief problem/feature description]

## Acceptance Criteria

- [ ] Core requirement 1
- [ ] Core requirement 2

## Context

[Any critical information]

## MVP

### ExampleController.php

```php
// app/Http/Controllers/ExampleController.php
class ExampleController extends Controller
{
    public function __construct()
    {
        $this->name = 'example';
    }
}
```

## References

- Related issue: #[issue_number]
- Documentation: [relevant_docs_url]
````

#### 📋 MORE (Standard Issue)

**Best for:** Most features, complex bugs, team collaboration

**Includes everything from MINIMAL plus:**

- Detailed background and motivation
- Technical considerations
- Success metrics
- Dependencies and risks
- Basic implementation suggestions

**Structure:**

```markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
source_docs:
  tickets: []
  docs: []
  figma: []
  plans: []
---

# [Issue Title]

## Overview

[Comprehensive description]

## Problem Statement / Motivation

[Why this matters]

## Proposed Solution

[High-level approach]

## Technical Considerations

- Architecture impacts
- Performance implications
- Security considerations

## Implementation Phases

#### Phase 1: [Phase Name]

##### Task 1.1: [Task Name]
**Files:** `path/to/file1.php`, `path/to/file2.php`
**Depends on:** None
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

##### Task 1.2: [Task Name]
**Files:** `path/to/file3.php`
**Depends on:** Task 1.1
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

#### Phase 2: [Phase Name]

##### Task 2.1: [Task Name]
**Files:** `path/to/file4.php`
**Depends on:** Task 1.2
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

## Acceptance Criteria

- [ ] Detailed requirement 1
- [ ] Detailed requirement 2
- [ ] Testing requirements

## Success Metrics

[How we measure success]

## Dependencies & Risks

[What could block or complicate this]

## References & Research

- Similar implementations: [file_path:line_number]
- Best practices: [documentation_url]
- Related PRs: #[pr_number]
```

#### 📚 A LOT (Comprehensive Issue)

**Best for:** Major features, architectural changes, complex integrations

**Includes everything from MORE plus:**

- Detailed implementation plan with phases
- Alternative approaches considered
- Extensive technical specifications
- Resource requirements and timeline
- Future considerations and extensibility
- Risk mitigation strategies
- Documentation requirements

**Structure:**

```markdown
---
title: [Issue Title]
type: [feat|fix|refactor]
status: active
date: YYYY-MM-DD
source_docs:
  tickets: []
  docs: []
  figma: []
  plans: []
---

# [Issue Title]

## Overview

[Executive summary]

## Problem Statement

[Detailed problem analysis]

## Proposed Solution

[Comprehensive solution design]

## Technical Approach

### Architecture

[Detailed technical design]

### Implementation Phases

#### Phase 1: [Foundation]

##### Task 1.1: [Task Name]
**Files:** `path/to/file1.php`, `path/to/file2.php`
**Depends on:** None
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

##### Task 1.2: [Task Name]
**Files:** `path/to/file3.php`
**Depends on:** Task 1.1
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

#### Phase 2: [Core Implementation]

##### Task 2.1: [Task Name]
**Files:** `path/to/file4.php`, `path/to/file5.php`
**Depends on:** Task 1.2
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

##### Task 2.2: [Task Name]
**Files:** `path/to/file6.php`
**Depends on:** Task 2.1
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

#### Phase 3: [Polish & Optimization]

##### Task 3.1: [Task Name]
**Files:** `path/to/file7.php`
**Depends on:** Task 2.2
**Success criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
**Test command:** `<project-appropriate test command>`

## Alternative Approaches Considered

[Other solutions evaluated and why rejected]

## Acceptance Criteria

### Functional Requirements

- [ ] Detailed functional criteria

### Non-Functional Requirements

- [ ] Performance targets
- [ ] Security requirements
- [ ] Accessibility standards

### Quality Gates

- [ ] Test coverage requirements
- [ ] Documentation completeness
- [ ] Code review approval

## Success Metrics

[Detailed KPIs and measurement methods]

## Dependencies & Prerequisites

[Detailed dependency analysis]

## Risk Analysis & Mitigation

[Comprehensive risk assessment]

## Resource Requirements

[Team, time, infrastructure needs]

## Future Considerations

[Extensibility and long-term vision]

## Documentation Plan

[What docs need updating]

## References & Research

### Internal References

- Architecture decisions: [file_path:line_number]
- Similar features: [file_path:line_number]
- Configuration: [file_path:line_number]

### External References

- Framework documentation: [url]
- Best practices guide: [url]
- Industry standards: [url]

### Related Work

- Previous PRs: #[pr_numbers]
- Related issues: #[issue_numbers]
- Design documents: [links]
```

### 5. Issue Creation & Formatting

<thinking>
Apply best practices for clarity and actionability, making the issue easy to scan and understand
</thinking>

**Content Formatting:**

- [ ] Use clear, descriptive headings with proper hierarchy (##, ###)
- [ ] Include code examples in triple backticks with language syntax highlighting
- [ ] Add screenshots/mockups if UI-related (drag & drop or use image hosting)
- [ ] Use task lists (- [ ]) for trackable items that can be checked off
- [ ] Add collapsible sections for lengthy logs or optional details using `<details>` tags
- [ ] Apply appropriate emoji for visual scanning (🐛 bug, ✨ feature, 📚 docs, ♻️ refactor)

**Cross-Referencing:**

- [ ] Link to related issues/PRs using #number format
- [ ] Reference specific commits with SHA hashes when relevant
- [ ] Link to code using permalink features (branch + commit SHA for permanent links)
- [ ] Mention relevant team members with @username if needed
- [ ] Add links to external resources with descriptive text

**Code & Examples:**

````markdown
# Good example with syntax highlighting and line references


```php
// app/Services/UserService.php:42
public function processUser(User $user): array
{
    // Implementation here
}
```

# Collapsible error logs

<details>
<summary>Full error stacktrace</summary>

`Error details here...`

</details>
````

**AI-Era Considerations:**

- [ ] Account for accelerated development with AI pair programming
- [ ] Include prompts or instructions that worked well during research
- [ ] Note which AI tools were used for initial exploration (Claude, Copilot, etc.)
- [ ] Emphasize comprehensive testing given rapid implementation
- [ ] Document any AI-generated code that needs human review

### 6. Final Review & Submission

**Pre-submission Checklist:**

- [ ] Title is searchable and descriptive
- [ ] Labels accurately categorize the issue
- [ ] All template sections are complete
- [ ] Links and references are working
- [ ] Acceptance criteria are measurable
- [ ] Add names of files in pseudo code examples and todo lists
- [ ] Add an ERD mermaid diagram if applicable for new model changes

## Directory Setup & Gitignore

Before writing the plan file, ensure the output directory and gitignore rules exist:

```bash
# Create docs/plans/ directory if it doesn't exist
mkdir -p docs/plans

# Ensure docs/plans/ and docs/brainstorms/ are in .gitignore (but NOT docs/solutions/)
if [ -f .gitignore ]; then
  grep -qxF 'docs/plans/' .gitignore || echo 'docs/plans/' >> .gitignore
  grep -qxF 'docs/brainstorms/' .gitignore || echo 'docs/brainstorms/' >> .gitignore
else
  printf 'docs/plans/\ndocs/brainstorms/\n' > .gitignore
fi
```

**IMPORTANT:** `docs/solutions/` must NOT be added to .gitignore -- it contains committed institutional knowledge.

## Output Format

**Filename:** Use the date and kebab-case filename from Step 2 Title & Categorization.

```
docs/plans/YYYY-MM-DD-<type>-<descriptive-name>-plan.md
```

Examples:
- ✅ `docs/plans/2026-01-15-feat-user-authentication-flow-plan.md`
- ✅ `docs/plans/2026-02-03-fix-checkout-race-condition-plan.md`
- ✅ `docs/plans/2026-03-10-refactor-api-client-extraction-plan.md`
- ❌ `docs/plans/2026-01-15-feat-thing-plan.md` (not descriptive - what "thing"?)
- ❌ `docs/plans/2026-01-15-feat-new-feature-plan.md` (too vague - what feature?)
- ❌ `docs/plans/2026-01-15-feat: user auth-plan.md` (invalid characters - colon and space)
- ❌ `docs/plans/feat-user-auth-plan.md` (missing date prefix)

## Post-Generation Options

After writing the plan file, use the **AskUserQuestion tool** to present these options:

**Question:** "Plan ready at `docs/plans/YYYY-MM-DD-<type>-<name>-plan.md`. What would you like to do next?"

**Options:**
1. **Open plan in editor** - Open the plan file for review
2. **Run `/deepen-plan`** - Enhance each section with parallel research agents (best practices, performance, UI)
3. **Run `/technical_review`** - Technical feedback from code-focused reviewers (Rabak Laravel, Rabak Vue, Simplicity)
4. **Review and refine** - Improve the document through structured self-review
5. **Start `/workflows:work`** - Begin implementing this plan locally
6. **Start `/workflows:work` on remote** - Begin implementing in Claude Code on the web (use `&` to run in background)
7. **Create Issue** - Create issue in project tracker

Based on selection:
- **Open plan in editor** → Run `open docs/plans/<plan_filename>.md` to open the file in the user's default editor
- **`/deepen-plan`** → Call the /deepen-plan command with the plan file path to enhance with research
- **`/technical_review`** → Call the /technical_review command with the plan file path
- **Review and refine** → Load `document-review` skill.
- **`/workflows:work`** → Call the /workflows:work command with the plan file path
- **`/workflows:work` on remote** → Run `/workflows:work docs/plans/<plan_filename>.md &` to start work in background for Claude Code web
- **Create Issue** → See "Issue Creation" section below
- **Other** (automatically provided) → Accept free text for rework or specific changes

**Note:** If running `/workflows:plan` with ultrathink enabled, automatically run `/deepen-plan` after plan creation for maximum depth and grounding.

Loop back to options after Simplify or Other changes until user selects `/workflows:work` or `/technical_review`.

## Issue Creation

When user selects "Create Issue":

1. **Save the plan as a tracker-ready description:**

   The plan file is already in markdown format. Inform the user:
   - "Plan saved at `[plan_path]`. You can create a ticket using the plan content."
   - Copy the plan content to clipboard if possible, or point to the file path

2. **After creation:**
   - Ask if they want to proceed to `/workflows:work` or `/technical_review`

NEVER CODE! Just research and write the plan.
