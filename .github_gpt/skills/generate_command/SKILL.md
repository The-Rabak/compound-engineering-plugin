---
name: generate_command
description: Create a new custom slash command following conventions and best practices
---

## Goal
Create a new custom slash command in `.github/commands/` that is specific, testable, and aligned with repository conventions.

## Use this skill when
- Creating a task-oriented command such as deploy, commit, triage, or project-specific automation.
- Converting a repeatable workflow into a reusable slash command.

## Do not use this skill when
- You are about to omit YAML frontmatter.
- You are about to produce a vague command with no verification steps.
- The task needs a skill directory with bundled references or scripts instead of a single command file.

## Operating rules
- Create the command in `.github/commands/[name].md`. Subdirectories such as `workflows/` are allowed.
- Start every command with YAML frontmatter.
- Use standard markdown for the command structure.
- Use `$ARGUMENTS` for dynamic inputs.
- Reference relevant patterns from `CLAUDE.md`.
- Include verification steps such as tests, linting, or `git diff`.
- Be explicit about constraints and scope.
- If the repository's command style uses structured XML-like tags inside the generated command body, preserve that convention with `<task>`, `<requirements>`, and `<constraints>`.

## Procedure / Reference
### Required frontmatter
```yaml
---
name: command-name
description: Brief description of what this command does (max 100 chars)
argument-hint: "[what arguments the command accepts]"
---
```

### Command structure
```markdown
# Command Title

Brief description of what this command does.

## Steps

1. First step with specific details
   - Include file paths, patterns, or constraints
   - Reference existing code if applicable

2. Second step
   - Use parallel tool calls when possible
   - Check and verify results

3. Final steps
   - Run tests
   - Run linting
   - Review the diff

## Success Criteria

- [ ] Tests pass
- [ ] Code follows the style guide
- [ ] Documentation updated if needed
```

### Example pattern
```markdown
Implement #$ARGUMENTS following these steps:

1. Research existing patterns
   - Search for similar code using Grep
   - Read relevant files to understand the approach

2. Plan the implementation
   - Think through edge cases and requirements
   - Consider test cases needed

3. Implement
   - Follow existing code patterns
   - Write tests first if doing TDD
   - Ensure code follows CLAUDE.md conventions

4. Verify
   - Run tests: use the project's test command (for example `npm test`, `pytest`, `cargo test`, or `php artisan test`)
   - Run a linter appropriate to the stack
   - Check changes with git diff

5. Commit if appropriate
   - Stage changes
   - Write a clear commit message
```

### File creation checklist
1. Create `.github/commands/[name].md`.
2. Add YAML frontmatter first.
3. Use the command structure shown above.
4. Test the command with realistic arguments.
