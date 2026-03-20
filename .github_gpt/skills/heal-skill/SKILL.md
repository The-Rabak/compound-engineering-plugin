---
name: heal-skill
description: Fix incorrect SKILL.md files when a skill has wrong instructions or outdated API references
---

## Goal
Repair a skill when its `SKILL.md`, references, or scripts contain incorrect instructions, outdated APIs, or broken workflow guidance.

## Use this skill when
- A skill fails because its instructions are wrong.
- An API reference, parameter, endpoint, or example is outdated.
- You discover a process bug while using a skill and need to fix the source files.

## Do not use this skill when
- You cannot identify which skill is affected; detect it first.
- The user has not approved the proposed edits yet.

## Operating rules
- Detect the active skill from context.
- Reflect on what failed, how the issue was discovered, and what the real fix is.
- Scan `SKILL.md`, `references/`, and `scripts/` in the affected skill directory.
- Present proposed edits with exact before/after content.
- Ask for approval before applying anything.
- After approval, apply changes, read the modified sections back, and optionally commit.
- Keep the fix consistent across all affected files.

## Procedure / Reference
### Step 1: detect the skill
Use conversation context, invocation messages, recent file references, and current task state.

Set:
```text
SKILL_NAME=[skill-name]
SKILL_DIR=./skills/$SKILL_NAME
```

If the skill is still unclear, ask the user.

### Step 2: analyze the failure
Determine:
- What was wrong
- How the problem was discovered
- The root cause
- The impact scope
- The files and sections that must change

### Step 3: scan affected files
```bash
ls -la $SKILL_DIR/
ls -la $SKILL_DIR/references/ 2>/dev/null
ls -la $SKILL_DIR/scripts/ 2>/dev/null
```

### Step 4: present the proposed changes
Use this format:
```text
**Skill being healed:** [skill-name]
**Issue discovered:** [1-2 sentence summary]
**Root cause:** [brief explanation]

**Files to be modified:**
- [ ] SKILL.md
- [ ] references/[file].md
- [ ] scripts/[file].py

**Proposed changes:**

### Change 1: SKILL.md - [Section name]
**Location:** Line [X] in SKILL.md

**Current (incorrect):**
[exact text from current file]

**Corrected:**
[new text]

**Reason:** [why this fixes the issue]

**Impact assessment:**
- Affects: [authentication/API endpoints/parameters/examples/etc.]

**Verification:**
These changes will prevent: [specific error that prompted this]
```

### Step 5: request approval
```text
Should I apply these changes?

1. Yes, apply and commit all changes
2. Apply but don't commit (let me review first)
3. Revise the changes (I'll provide feedback)
4. Cancel (don't make changes)

Choose (1-4):
```

Do not proceed without approval.

### Step 6: apply and verify
After approval:
1. Edit each affected file.
2. Read back the changed sections.
3. Check cross-file consistency.
4. Commit if option 1 was chosen.
5. Confirm completion with the modified file list.
