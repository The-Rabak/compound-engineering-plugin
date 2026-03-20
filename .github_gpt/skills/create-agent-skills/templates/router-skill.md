# Router Skill

## Purpose
Use this template as a reusable starting point for `create-agent-skills`.

## How to use it
- Copy the structure, then fill in project-specific content.
- Preserve required fields, headings, and placeholders unless the parent skill explicitly says otherwise.
- Do not treat this file as general prose; treat it as executable structure.

## Reference content

---
name: {{SKILL_NAME}}
description: {{What it does}} Use when {{trigger conditions}}.
---

## Essential Principles
## {{Core Concept}}

{{Principles that ALWAYS apply, regardless of which workflow runs}}

### 1. {{First principle}}
{{Explanation}}

### 2. {{Second principle}}
{{Explanation}}

### 3. {{Third principle}}
{{Explanation}}

## Intake
**Ask the user:**

What would you like to do?
1. {{First option}}
2. {{Second option}}
3. {{Third option}}

**Wait for response before proceeding.**

## Routing
| Response | Workflow |
|----------|----------|
| 1, "{{keywords}}" | `workflows/{{first-workflow}}.md` |
| 2, "{{keywords}}" | `workflows/{{second-workflow}}.md` |
| 3, "{{keywords}}" | `workflows/{{third-workflow}}.md` |

**After reading the workflow, follow it exactly.**

## Quick Reference
## {{Skill Name}} Quick Reference

{{Brief reference information always useful to have visible}}

## Reference Index
## Domain Knowledge

All in `references/`:
- {{reference-1.md}} - {{purpose}}
- {{reference-2.md}} - {{purpose}}

## Workflows Index
## Workflows

All in `workflows/`:

| Workflow | Purpose |
|----------|---------|
| {{first-workflow}}.md | {{purpose}} |
| {{second-workflow}}.md | {{purpose}} |
| {{third-workflow}}.md | {{purpose}} |

## Success Criteria
A well-executed {{skill name}}:
- {{First criterion}}
- {{Second criterion}}
- {{Third criterion}}
