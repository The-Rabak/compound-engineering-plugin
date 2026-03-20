---
name: workflows-compound
description: Document a recently solved problem to compound your team's knowledge
---

## Goal
Capture a verified, non-trivial solved problem as a single searchable solution document in `docs/solutions/`.

## Use this skill when
- A problem is solved, verified, and worth documenting while context is still fresh.
- The fix involved meaningful debugging, investigation, or a non-obvious solution.
- The team would benefit from a reusable solution document with YAML frontmatter.

## Do not use this skill when
- The problem is still in progress or the fix is not verified.
- The issue was trivial, obvious, or not worth long-term documentation.
- You are being asked to create drafts or multiple intermediate files.

## Non-negotiable rules
- Only one file may be written: the final documentation file.
- Phase 1 subagents must return text data only. They must not write files.
- Do not create intermediate notes, drafts, or helper artifacts.
- You must launch all six Phase 1 research subagents in parallel.
- You must wait for all Phase 1 results before writing anything.
- If Phase 3 enhancement agents are applicable, run them in parallel after the single file is written.
- Include an `Execution Context` section when session-file learnings are relevant.

## Procedure
Execute the full source-of-truth workflow below. Preserve every conditional branch, phase, checklist, and validation step from the original instructions. When the workflow says to ask, wait, route, or run in parallel, do that exactly.

#### Arguments
[optional: brief context about the fix]

### /compound

Coordinate multiple subagents working in parallel to document a recently solved problem.

#### Purpose

Captures problem solutions while context is fresh, creating structured documentation in `docs/solutions/` with YAML frontmatter for searchability and future reference. Uses parallel subagents for maximum efficiency.

**Why "compound"?** Each documented solution compounds your team's knowledge. The first time you solve a problem takes research. Document it, and the next occurrence takes minutes. Knowledge compounds.

#### Usage

```bash
/workflows-compound                    # Document the most recent fix
/workflows-compound [brief context]    # Provide additional context hint
```

#### Execution Strategy: Two-Phase Orchestration

**Only ONE file gets written - the final documentation.**

Phase 1 subagents return TEXT DATA to the orchestrator. They must NOT use Write, Edit, or create any files. Only the orchestrator (Phase 2) writes the final documentation file.

##### Phase 1: Parallel Research


Launch these subagents IN PARALLEL. Each returns text data to the orchestrator.

###### 1. **Context Analyzer**
   - Extracts conversation history
   - Identifies problem type, component, symptoms
   - Validates against schema
   - Returns: YAML frontmatter skeleton

###### 2. **Solution Extractor**
   - Analyzes all investigation steps
   - Identifies root cause
   - Extracts working solution with code examples
   - Returns: Solution content block

###### 3. **Related Docs Finder**
   - Searches `docs/solutions/` for related documentation
   - Identifies cross-references and links
   - Finds related GitHub issues
   - Returns: Links and relationships

###### 4. **Prevention Strategist**
   - Develops prevention strategies
   - Creates best practices guidance
   - Generates test cases if applicable
   - Returns: Prevention/testing content

###### 5. **Category Classifier**
   - Determines optimal `docs/solutions/` category
   - Validates category against schema
   - Suggests filename based on slug
   - Returns: Final path and filename

###### 6. **Execution Session Analyzer**
   - Searches `docs/execution-sessions/` for recent session files related to the current fix
   - Reads session files and extracts recurring patterns (e.g., same error across multiple tasks)
   - Identifies problems that were encountered and how they were fixed during execution
   - Cross-references with the current problem being documented
   - Returns: Execution context and recurring patterns


##### Phase 2: Assembly & Write


**WAIT for all Phase 1 subagents to complete before proceeding.**

The orchestrating agent (main conversation) performs these steps:

1. Collect all text results from Phase 1 subagents
   **Include execution session learnings:** If the Execution Session Analyzer found relevant session files, incorporate execution learnings into the documentation:
   - Add an "## Execution Context" section if problems were first discovered during task execution
   - Include the progression of how the problem was encountered and resolved across multiple task attempts
   - Reference the session file path for traceability (e.g., `docs/execution-sessions/work-2026-02-19-143022/task-03-create-auth-service.md`)
2. Assemble complete markdown file from the collected pieces
3. Validate YAML frontmatter against schema
4. Create directory if needed: `mkdir -p docs/solutions/[category]/`
5. Write the SINGLE final file: `docs/solutions/[category]/[filename].md`


##### Phase 3: Optional Enhancement

**WAIT for Phase 2 to complete before proceeding.**


Based on problem type, optionally invoke specialized agents to review the documentation:

- **performance_issue** -> `performance-oracle`
- **security_issue** -> `security-sentinel`
- **database_issue** -> `data-integrity-guardian`
- **test_failure** -> `rabak-laravel-reviewer` + `code-simplicity-reviewer`
- Any code-heavy issue -> `rabak-laravel-reviewer` + `code-simplicity-reviewer`


#### What It Captures

- **Problem symptom**: Exact error messages, observable behavior
- **Investigation steps tried**: What didn't work and why
- **Root cause analysis**: Technical explanation
- **Working solution**: Step-by-step fix with code examples
- **Prevention strategies**: How to avoid in future
- **Cross-references**: Links to related issues and docs
- **Execution session learnings**: Patterns and fixes discovered during `/workflows-work` task execution (from `docs/execution-sessions/`)

#### Preconditions

    Problem has been solved (not in-progress)
    Solution has been verified working
    Non-trivial problem (not simple typo or obvious error)

#### What It Creates

**Organized documentation:**

- File: `docs/solutions/[category]/[filename].md`

**Categories auto-detected from problem:**

- build-errors/
- test-failures/
- runtime-errors/
- performance-issues/
- database-issues/
- security-issues/
- ui-bugs/
- integration-issues/
- logic-errors/

#### Common Mistakes to Avoid

| [!] Wrong |  Correct |
|----------|-----------|
| Subagents write files like `context-analysis.md`, `solution-draft.md` | Subagents return text data; orchestrator writes one final file |
| Research and assembly run in parallel | Research completes -> then assembly runs |
| Multiple files created during workflow | Single file: `docs/solutions/[category]/[filename].md` |

#### Success Output

```
 Documentation complete

Subagent Results:
   Context Analyzer: Identified performance_issue in brief_system
   Solution Extractor: 3 code fixes
   Related Docs Finder: 2 related issues
   Prevention Strategist: Prevention strategies, test suggestions
   Category Classifier: `performance-issues`
   Execution Session Analyzer: Found 2 related session files, 1 recurring pattern

Specialized Agent Reviews (Auto-Triggered):
   performance-oracle: Validated query optimization approach
   rabak-laravel-reviewer: Code examples meet project standards
   code-simplicity-reviewer: Solution is appropriately minimal
   code-simplicity-reviewer: Solution is appropriately minimal

File created:
- docs/solutions/performance-issues/n-plus-one-brief-generation.md

This documentation will be searchable for future reference when similar
issues occur in the Email Processing or Brief System modules.

What's next?
1. Continue workflow (recommended)
2. Link related documentation
3. Update other references
4. View documentation
5. Other
```

#### The Compounding Philosophy

This creates a compounding knowledge system:

1. First time you solve "N+1 query in brief generation" -> Research (30 min)
2. Document the solution -> docs/solutions/performance-issues/n-plus-one-briefs.md (5 min)
3. Next time similar issue occurs -> Quick lookup (2 min)
4. Knowledge compounds -> Team gets smarter

The feedback loop:

```
Build -> Execute (session files) -> Test -> Find Issue -> Research -> Improve -> Document -> Validate -> Deploy
                                                                                                  
    
```

**Each unit of engineering work should make subsequent units of work easier--not harder.**

#### Auto-Invoke

Trigger phrases: "that worked", "it's fixed", "working now", "problem solved"

Use /workflows-compound [context] to document immediately without waiting for auto-detection.

#### Routes To

`compound-docs` skill

#### Applicable Specialized Agents

Based on problem type, these agents can enhance documentation:

##### Code Quality & Review
- **rabak-laravel-reviewer**: Reviews code examples for Laravel best practices
- **code-simplicity-reviewer**: Ensures solution code is minimal and clear
- **pattern-recognition-specialist**: Identifies anti-patterns or repeating issues

##### Specific Domain Experts
- **performance-oracle**: Analyzes performance_issue category solutions
- **security-sentinel**: Reviews security_issue solutions for vulnerabilities
- **rabak-laravel-reviewer**: Reviews code examples for prevention test strategies
- **data-integrity-guardian**: Reviews database_issue migrations and queries

##### Enhancement & Documentation
- **best-practices-researcher**: Enriches solution with industry best practices
- **rabak-vue-reviewer**: Reviews frontend code for Vue.js conventions
- **framework-docs-researcher**: Links to Laravel/package documentation references

##### When to Invoke
- **Auto-triggered** (optional): Agents can run post-documentation for enhancement
- **Manual trigger**: User can invoke agents after /workflows-compound completes for deeper review
- **Customize agents**: Edit `compound-engineering.local.md` or invoke the `setup` skill to configure which review agents are used across all workflows

#### Related Commands

- `/research [topic]` - Deep investigation (searches docs/solutions/ for patterns)
- `/workflows-plan` - Planning workflow (references documented solutions)

## Required output
Return a completion report in this shape:
```text
Documentation complete

Subagent results:
- Context Analyzer: ...
- Solution Extractor: ...
- Related Docs Finder: ...
- Prevention Strategist: ...
- Category Classifier: ...
- Execution Session Analyzer: ...

Specialized agent reviews:
- ...

File created:
- docs/solutions/[category]/[filename].md
```
