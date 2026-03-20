# Critical Pattern Template

## Purpose
Use this asset as a reusable starting point for `compound-docs`.

## How to use it
- Copy the structure, then fill in project-specific content.
- Preserve required fields, headings, and placeholders unless the parent skill explicitly says otherwise.
- Do not treat this file as general prose; treat it as executable structure.

## Reference content

Use this template when adding a pattern to `docs/solutions/patterns/critical-patterns.md`:

---

## N. [Pattern Name] (ALWAYS REQUIRED)

### ❌ WRONG ([Will cause X error])
```[language]
[code showing wrong approach]
```

### ✅ CORRECT
```[language]
[code showing correct approach]
```

**Why:** [Technical explanation of why this is required]

**Placement/Context:** [When this applies]

**Documented in:** `docs/solutions/[category]/[filename].md`

---

**Instructions:**
1. Replace N with the next pattern number
2. Replace [Pattern Name] with descriptive title
3. Fill in WRONG example with code that causes the problem
4. Fill in CORRECT example with the solution
5. Explain the technical reason in "Why"
6. Clarify when this pattern applies in "Placement/Context"
7. Link to the full troubleshooting doc where this was originally solved
