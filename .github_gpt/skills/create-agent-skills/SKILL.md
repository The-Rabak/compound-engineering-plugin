---
name: create-agent-skills
description: >-
  Expert guidance for creating the host CLI skills and slash commands. Use when working with SKILL.md files, authoring
  new skills, improving existing skills, creating slash commands, or understanding skill structure and best practices.
---

## Goal
Create, edit, audit, and explain the host CLI skills and slash commands using the official skill format and progressive disclosure patterns.

## Use this skill when
- Creating or updating `SKILL.md` files.
- Building new skills or custom slash commands.
- Auditing an existing skill against best practices.
- Explaining skill frontmatter, invocation behavior, or bundled resource structure.

## Do not use this skill when
- You plan to keep XML tags in a `SKILL.md` body; use standard markdown headings instead.
- You are building a side-effect workflow but intend to omit `disable-model-invocation: true`.
- You want deep reference nesting beyond one level from `SKILL.md`.

## Operating rules
- Treat skills and commands as the same capability surface. A file in `.github_gpt/commands/review.md` and a skill in `.github_gpt/skills/review/SKILL.md` both create `/review`.
- If a skill and a command share the same name, the skill takes precedence.
- Use a command file for a simple manual workflow with no supporting files.
- Use a skill directory when supporting files, background knowledge, or progressive disclosure are needed.
- Keep `SKILL.md` under 500 lines when possible.
- Keep references one level deep and link them directly from `SKILL.md`.
- Use concrete examples and real usage tests.

## Procedure / Reference
### Choose the right format
Use a command file such as `commands/name.md` when:
- The workflow is simple and single-file.
- No supporting files are needed.
- The task is action-oriented, such as deploy, commit, or triage.

Use a skill directory such as `skills/name/SKILL.md` when:
- Supporting references, scripts, or templates are needed.
- Background knowledge should auto-load.
- The skill benefits from progressive disclosure.

### Standard markdown format
```markdown
---
name: my-skill-name
description: What it does and when to use it
---

# My Skill Name

## Quick Start
Immediate actionable guidance...

## Instructions
Step-by-step procedures...

## Examples
Concrete usage examples...
```

### Frontmatter reference
| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Display name. Lowercase letters, numbers, hyphens. Max 64 chars. Defaults to directory name. |
| `description` | Recommended | What it does and when to use it. Max 1024 chars. Critical for discovery. |
| `argument-hint` | No | Hint shown during autocomplete, such as `[issue-number]`. |
| `disable-model-invocation` | No | Set `true` for manual workflows with side effects. |
| `user-invocable` | No | Set `false` for background knowledge that should not appear in the slash menu. |
| `allowed-tools` | No | Tools the model can use without prompts, such as `Read, Bash(git *)`. |
| `model` | No | `haiku`, `sonnet`, or `opus`. |
| `context` | No | Set `fork` to run in an isolated subagent context. |
| `agent` | No | Subagent type when `context: fork`, such as `Explore`, `Plan`, or `general-purpose`. |

### Invocation control
| Frontmatter | User can invoke | the model can invoke | When loaded |
|-------------|----------------|-------------------|-------------|
| default | Yes | Yes | Description is always available; full content loads on invocation |
| `disable-model-invocation: true` | Yes | No | Description is not available for auto-discovery; content loads only when the user invokes it |
| `user-invocable: false` | No | Yes | Description remains available for auto-discovery; content loads when relevant |

Use `disable-model-invocation: true` for workflows with side effects such as `/deploy`, `/commit`, `/triage-prs`, or `/send-slack-message`.
Use `user-invocable: false` for background knowledge such as conventions, legacy system notes, or domain context.

### Dynamic features
Arguments:
```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

Access individual arguments with `$ARGUMENTS[0]` or `$0`, `$1`, `$2`.

Dynamic context injection:
```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Context
- Branch diff: !`git diff main...HEAD`
- Changed files: !`git diff --name-only main...HEAD`

Summarize this pull request...
```

Running in a subagent:
```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files
2. Analyze the code
3. Summarize findings
```

### Progressive disclosure
```text
my-skill/
|- SKILL.md
|- reference.md
|- examples.md
`- scripts/
   `- helper.py
```

Link detailed files directly, for example: `For API details, see [reference.md](reference.md).`

### Effective descriptions
Good:
```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

Bad:
```yaml
description: Helps with documents
```

### Create a new skill or command
Step 1: choose the type.
- Manual workflow -> command with `disable-model-invocation: true`
- Background knowledge -> skill without `disable-model-invocation`
- Complex workflow with supporting files -> skill directory

Step 2: create the file.

Command template:
```markdown
---
name: my-command
description: What this command does
argument-hint: [expected arguments]
disable-model-invocation: true
allowed-tools: Bash(gh *), Read
---

# Command Title

## Workflow

### Step 1: Gather Context
...

### Step 2: Execute
...

## Success Criteria
- [ ] Expected outcome 1
- [ ] Expected outcome 2
```

Skill template:
```markdown
---
name: my-skill
description: What it does. Use when [trigger conditions].
---

# Skill Title

## Quick Start
[Immediate actionable example]

## Instructions
[Core guidance]

## Examples
[Concrete input/output pairs]
```

Step 3: add reference files when needed.
```markdown
For API reference, see [reference.md](reference.md).
For form filling guide, see [forms.md](forms.md).
```

Step 4: test with real usage.
1. Invoke directly with `/skill-name`.
2. Verify auto-triggering with a realistic request.
3. Refine after real use, not synthetic demos.

### Audit checklist
- [ ] Valid YAML frontmatter
- [ ] Specific description with trigger keywords
- [ ] Standard markdown headings in `SKILL.md`
- [ ] `SKILL.md` under 500 lines
- [ ] `disable-model-invocation: true` for side effects
- [ ] `allowed-tools` declared when needed
- [ ] References are one level deep and properly linked
- [ ] Examples are concrete
- [ ] Tested with real usage

### Anti-patterns
- XML tags in `SKILL.md` bodies
- Vague descriptions
- Deep nesting
- Missing invocation control
- Too many equal options with no default path
- Scripts that punt error handling back to the model

### Reference files
- [references/official-spec.md](./references/official-spec.md)
- [references/best-practices.md](./references/best-practices.md)
- [references/core-principles.md](./references/core-principles.md)
- [references/skill-structure.md](./references/skill-structure.md)
- [references/recommended-structure.md](./references/recommended-structure.md)
- [references/common-patterns.md](./references/common-patterns.md)
- [references/be-clear-and-direct.md](./references/be-clear-and-direct.md)
- [references/executable-code.md](./references/executable-code.md)
- [references/using-scripts.md](./references/using-scripts.md)
- [references/using-templates.md](./references/using-templates.md)
- [references/workflows-and-validation.md](./references/workflows-and-validation.md)
- [references/iteration-and-testing.md](./references/iteration-and-testing.md)
- [references/api-security.md](./references/api-security.md)
- [templates/simple-skill.md](./templates/simple-skill.md)
- [templates/router-skill.md](./templates/router-skill.md)
- [workflows/create-new-skill.md](./workflows/create-new-skill.md)
- [workflows/audit-skill.md](./workflows/audit-skill.md)
- [workflows/get-guidance.md](./workflows/get-guidance.md)
- [workflows/upgrade-to-router.md](./workflows/upgrade-to-router.md)
- [workflows/add-reference.md](./workflows/add-reference.md)
- [workflows/add-script.md](./workflows/add-script.md)
- [workflows/add-template.md](./workflows/add-template.md)
- [workflows/add-workflow.md](./workflows/add-workflow.md)
- [workflows/create-domain-expertise-skill.md](./workflows/create-domain-expertise-skill.md)
- [workflows/verify-skill.md](./workflows/verify-skill.md)
