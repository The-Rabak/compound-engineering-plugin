# Workflow: Add a Template to a Skill

## Goal
Execute the `Workflow: Add a Template to a Skill` workflow directly and completely.

## Use this workflow when
- The parent skill routes you here for a concrete sub-procedure.
- You need a narrow, deterministic sequence of steps rather than the whole skill.

## Operating rules
- Follow the steps in order unless a dependency is missing.
- If this workflow references other local docs, read them before proceeding.
- Preserve validation and stop conditions exactly.

## Reference content

## Required Reading
**Read these reference files NOW:**
1. references/using-templates.md

## Process
## Step 1: Identify the Skill

Ask (if not already provided):
- Which skill needs a template?
- What output does this template structure?

## Step 2: Analyze Template Need

Confirm this is a good template candidate:
- [ ] Output has consistent structure across uses
- [ ] Structure matters more than creative generation
- [ ] Filling placeholders is more reliable than blank-page generation

If not a good fit, suggest alternatives (workflow guidance, reference examples).

## Step 3: Create Templates Directory

```bash
mkdir -p ~/.github_gpt/skills/{skill-name}/templates
```

## Step 4: Design Template Structure

Gather requirements:
- What sections does the output need?
- What information varies between uses? (→ placeholders)
- What stays constant? (→ static structure)

## Step 5: Write Template File

Create `templates/{template-name}.md` with:
- Clear section markers
- `{{PLACEHOLDER}}` syntax for variable content
- Brief inline guidance where helpful
- Minimal example content

## Step 6: Update Workflow to Use Template

Find the workflow that produces this output. Add:
```xml
<process>
...
N. Read `templates/{template-name}.md`
N+1. Copy template structure
N+2. Fill each placeholder based on gathered context
...
</process>
```

## Step 7: Test

Invoke the skill workflow and verify:
- Template is read at the right step
- All placeholders get filled appropriately
- Output structure matches template
- No placeholders left unfilled

## Success Criteria
Template is complete when:
- [ ] templates/ directory exists
- [ ] Template file has clear structure with placeholders
- [ ] At least one workflow references the template
- [ ] Workflow instructions explain when/how to use template
- [ ] Tested with real invocation
