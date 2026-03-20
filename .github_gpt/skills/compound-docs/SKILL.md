---
name: compound-docs
description: Capture solved problems as categorized documentation with YAML frontmatter for fast lookup
platforms:
  claude:
    allowed-tools:
      - Read
      - Write
      - Bash
      - Grep
    disable-model-invocation: true
---

## Goal
Capture non-trivial solved problems as categorized documentation in `docs/solutions/` with validated YAML frontmatter so future sessions can find and reuse the solution.

## Use this skill when
- A problem is confirmed solved with phrases like "that worked", "it's fixed", "working now", "problem solved", or "that did it".
- The issue required multiple attempts, tricky debugging, or a non-obvious fix.
- The user manually invokes `/doc-fix`.

## Do not use this skill when
- The fix was a trivial typo, obvious syntax error, or immediate correction.
- Critical context is missing and has not been collected yet.
- YAML validation has failed and the data has not been corrected.

## Operating rules
- Follow the seven-step sequence in order.
- Treat Step 2 and Step 5 as blocking gates.
- Do not write the documentation file until the YAML frontmatter passes validation against `schema.yaml` and [references/yaml-schema.md](./references/yaml-schema.md).
- Use [assets/resolution-template.md](./assets/resolution-template.md) for the solution document.
- Use [assets/critical-pattern-template.md](./assets/critical-pattern-template.md) only when the user chooses to promote a pattern.
- Search for similar issues before creating a new file.
- After capture, present the decision menu and wait for the user's choice.

## Procedure / Reference
### Step 1: detect confirmation
Auto-invoke after these phrases:
- "that worked"
- "it's fixed"
- "working now"
- "problem solved"
- "that did it"

Manual trigger: `/doc-fix`

### Step 2: gather context
Collect:
- Module name
- Exact symptom or error message
- Investigation attempts that failed
- Root cause
- Solution
- Prevention guidance
- Environment details such as Laravel version, stage, OS version, and file:line references

If critical context is missing, ask and wait:
```text
I need a few details to document this properly:

1. Which module had this issue? [ModuleName]
2. What was the exact error message or symptom?
3. What stage were you in? (0-6 or post-implementation)

[Continue after user provides details]
```

### Step 3: check existing docs
```bash
grep -r "exact error phrase" docs/solutions/
ls docs/solutions/[category]/
```

If a similar issue exists, present:
```text
Found similar issue: docs/solutions/[path]

What's next?
1. Create new doc with cross-reference (recommended)
2. Update existing doc (only if same root cause)
3. Other

Choose (1-3): _
```

### Step 4: generate the filename
Format:
```text
[sanitized-symptom]-[module]-[YYYYMMDD].md
```

Sanitization rules:
- Lowercase
- Replace spaces with hyphens
- Remove special characters except hyphens
- Keep the name under 80 characters when possible

Examples:
- `missing-include-BriefSystem-20251110.md`
- `parameter-not-saving-state-EmailProcessing-20251110.md`
- `webview-crash-on-resize-Assistant-20251110.md`

### Step 5: validate YAML schema
Validate against `schema.yaml` and [references/yaml-schema.md](./references/yaml-schema.md).

Required shape:
```yaml
module: [string]
date: YYYY-MM-DD
problem_type: [from enum]
component: [from enum]
symptoms: [array, 1-5 items]
root_cause: [from enum]
severity: [critical|high|medium|low]
tags: [array]
```

If validation fails, block and show specific errors.

### Step 6: create the documentation
Determine the category from `problem_type`, then write:
```bash
PROBLEM_TYPE="[from validated YAML]"
CATEGORY="[mapped from problem_type]"
FILENAME="[generated-filename].md"
DOC_PATH="docs/solutions/${CATEGORY}/${FILENAME}"

mkdir -p "docs/solutions/${CATEGORY}"
```

Populate the document from [assets/resolution-template.md](./assets/resolution-template.md).

### Step 7: cross-reference and detect critical patterns
If related docs exist, add links both ways.

Example cross-reference append:
```bash
echo "- See also: [$FILENAME]($REAL_FILE)" >> [similar-doc.md]
```

If the issue represents a common pattern with 3 or more similar cases, propose updating `docs/solutions/patterns/common-solutions.md`.

### Post-capture decision menu
```text
[OK] Solution documented

File created:
- docs/solutions/[category]/[filename].md

What's next?
1. Continue workflow (recommended)
2. Add to Required Reading - Promote to critical patterns (critical-patterns.md)
3. Link related issues - Connect to similar problems
4. Add to existing skill - Add to a learning skill (e.g., compound-docs)
5. Create new skill - Extract into new learning skill
6. View documentation - See what was captured
7. Other
```

### Critical files
- `schema.yaml`
- [references/yaml-schema.md](./references/yaml-schema.md)
- [assets/resolution-template.md](./assets/resolution-template.md)
- [assets/critical-pattern-template.md](./assets/critical-pattern-template.md)
