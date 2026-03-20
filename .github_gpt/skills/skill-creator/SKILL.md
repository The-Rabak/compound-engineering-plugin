---
name: skill-creator
description: >-
  Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an
  existing skill) that extends the model's capabilities with specialized knowledge, workflows, or tool integrations.
platforms:
  claude:
    disable-model-invocation: true
---

## Goal
Create or improve a skill package that gives another the model instance reusable workflows, domain knowledge, and bundled resources.

## Use this skill when
- Creating a new skill from scratch.
- Updating an existing skill.
- Deciding what should live in `SKILL.md`, `scripts/`, `references/`, or `assets/`.
- Packaging and validating a skill for distribution.

## Do not use this skill when
- You plan to put executable logic in references or long documentation in scripts.
- You plan to nest references more than one level deep.
- You intend to write the skill in second person instead of imperative or infinitive form.

## Operating rules
- Structure the skill as a package, not just a markdown file.
- Keep `SKILL.md` focused on purpose, triggers, and workflow guidance.
- Move detailed documentation into `references/`.
- Put deterministic or repeatedly reused logic into `scripts/`.
- Put output templates, images, boilerplate, and other non-context resources into `assets/`.
- Write `SKILL.md` in imperative or infinitive form.
- Follow the creation steps in order unless there is a clear reason to skip one.

## Procedure / Reference
### Skill anatomy
```text
skill-name/
|- SKILL.md
|  |- YAML frontmatter
|  `- Markdown instructions
`- Bundled Resources
   |- scripts/
   |- references/
   `- assets/
```

### Bundled resources
Scripts (`scripts/`):
- Use for deterministic execution or code that would otherwise be rewritten repeatedly.
- Example: `scripts/rotate_pdf.py`

References (`references/`):
- Use for documentation the model should consult while working.
- Examples: schemas, API docs, policies, domain notes.
- Keep large references searchable and avoid duplicating the same content in `SKILL.md`.

Assets (`assets/`):
- Use for files that should be copied, rendered, or shipped in outputs.
- Examples: templates, images, fonts, boilerplate projects.

### Progressive disclosure
Use the three loading layers deliberately:
1. Metadata in frontmatter
2. `SKILL.md` body
3. Bundled resources loaded or executed as needed

### Step 1: understand the skill with concrete examples
Collect realistic trigger phrases, usage examples, and expected outcomes. Validate assumptions with the user when needed.

### Step 2: plan reusable contents
For each example, decide whether the reusable part belongs in:
- `scripts/`
- `references/`
- `assets/`

### Step 3: initialize the skill
```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

The initializer creates the skill directory, a starter `SKILL.md`, and example resource folders.

### Step 4: edit the skill
- Remove unused example files.
- Add the reusable resources first.
- Then update `SKILL.md` so another the model instance can use the package effectively.
- Write in imperative or infinitive form, not second person.

### Step 5: package the skill
```bash
scripts/package_skill.py <path/to/skill-folder>
scripts/package_skill.py <path/to/skill-folder> ./dist
```

Packaging automatically validates:
- YAML frontmatter
- Naming and directory conventions
- Description completeness
- File organization and resource references

### Step 6: iterate
Use the skill on real tasks, notice where it struggles, then update `SKILL.md` or bundled resources and test again.

### Included helper scripts
- `scripts/init_skill.py`
- `scripts/package_skill.py`
- `scripts/quick_validate.py`
