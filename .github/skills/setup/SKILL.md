---
name: setup
description: Configure which review agents run for your project. Auto-detects stack and writes compound-engineering.local.md.
model: gpt-5.3-codex
---

# Compound Engineering Setup

Interactive setup for `compound-engineering.local.md` -- configures which agents run during `/workflows-review` and `/workflows-work`.

## Step 1: Check Existing Config

Read `compound-engineering.local.md` in the project root. If it exists, display current settings summary and use AskUserQuestion:

```
question: "Settings file already exists. What would you like to do?"
header: "Config"
options:
  - label: "Reconfigure"
    description: "Run the interactive setup again from scratch"
  - label: "View current"
    description: "Show the file contents, then stop"
  - label: "Cancel"
    description: "Keep current settings"
```

If "View current": read and display the file, then stop.
If "Cancel": stop.

## Step 2: Detect and Ask

Auto-detect the project stack by checking for common project indicators:

```bash
# Detect project stack from root files
if [ -f "artisan" ] && [ -f "composer.json" ]; then
  echo "laravel"
elif [ -f "Cargo.toml" ]; then
  echo "rust"
elif [ -f "nest-cli.json" ] || grep -q '"@nestjs/core"' package.json 2>/dev/null; then
  echo "nestjs"
elif [ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ] || [ -d "src/main/java" ]; then
  echo "java"
elif [ -f "nuxt.config.ts" ] || [ -f "nuxt.config.js" ]; then
  echo "nuxt"
elif [ -f "next.config.ts" ] || [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
  echo "nextjs"
elif [ -f "angular.json" ]; then
  echo "angular"
elif [ -f "vite.config.ts" ] && grep -q '"vue"' package.json 2>/dev/null; then
  echo "vue"
elif [ -f "vite.config.ts" ] && grep -q '"react"' package.json 2>/dev/null; then
  echo "react"
elif [ -f "composer.json" ]; then
  echo "php"
elif [ -f "tsconfig.json" ]; then
  echo "typescript"
elif [ -f "package.json" ]; then
  echo "javascript"
elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
  echo "python"
elif [ -f "go.mod" ]; then
  echo "go"
else
  echo "general"
fi
```

Use AskUserQuestion:

```
question: "Detected {type} project. How would you like to configure?"
header: "Setup"
options:
  - label: "Auto-configure (Recommended)"
    description: "Use smart defaults for {type}. Done in one click."
  - label: "Customize"
    description: "Choose stack, focus areas, and review depth."
```

### If Auto-configure -> Skip to Step 4 with defaults:

- **Laravel:** `[rabak-laravel-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **PHP:** `[rabak-laravel-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Vue/Nuxt:** `[rabak-vue-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **React/Next.js:** `[rabak-typescript-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Angular:** `[rabak-typescript-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **NestJS:** `[rabak-nest-reviewer, rabak-typescript-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Java:** `[rabak-java-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **TypeScript:** `[rabak-typescript-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **JavaScript:** `[rabak-typescript-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Python:** `[rabak-python-reviewer, constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Rust:** `[constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]`
- **Go:** `[constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]`
- **General:** `[constitution-guardian, code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]`

### If Customize -> Step 3

## Step 3: Customize (5 questions)

**a. Stack** -- confirm or override:

```
question: "Which stack should we optimize for?"
header: "Stack"
options:
  - label: "{detected_type} (Recommended)"
    description: "Auto-detected from project files"
  - label: "Laravel"
    description: "Laravel PHP -- adds Laravel convention reviewer"
  - label: "Vue/Nuxt"
    description: "Vue.js / Nuxt -- adds frontend reviewer"
  - label: "React/Next.js"
    description: "React / Next.js -- adds TypeScript reviewer"
  - label: "Angular"
    description: "Angular -- adds TypeScript reviewer"
  - label: "NestJS"
    description: "NestJS -- adds NestJS and TypeScript reviewers"
  - label: "Java"
    description: "Java / JVM -- adds Java reviewer"
  - label: "Python"
    description: "Python -- adds Pythonic pattern reviewer"
  - label: "Rust"
    description: "Rust -- adds architecture reviewer"
  - label: "Go"
    description: "Go -- adds architecture reviewer"
```

Only show options that differ from the detected type.

**b. Focus areas** -- multiSelect:

```
question: "Which review areas matter most?"
header: "Focus"
multiSelect: true
options:
   - label: "Security"
     description: "Vulnerability scanning, auth, input validation (security-sentinel)"
   - label: "Performance"
     description: "N+1 queries, memory leaks, complexity (performance-oracle)"
   - label: "Architecture"
     description: "Design patterns, SOLID, separation of concerns (architecture-strategist)"
   - label: "Code simplicity"
     description: "Over-engineering, DRY failures, readability regressions (code-simplicity-reviewer)"
```

**c. Depth:**

```
question: "How thorough should reviews be?"
header: "Depth"
options:
   - label: "Thorough (Recommended)"
     description: "Stack reviewers + constitution guardrails + all selected focus agents."
   - label: "Fast"
     description: "Stack reviewers + constitution guardrails + code simplicity only."
   - label: "Comprehensive"
     description: "All above + git history, data integrity, and agent-native checks."
```

**d. TDD mode:**

```
question: "Enable TDD mode?"
header: "TDD"
options:
  - label: "Disabled (Default)"
    description: "Standard implementation workflow. Tests optional."
  - label: "Enabled"
    description: "Enforces test-first workflow. Agents verify tests exist before implementation proceeds."
```

**e. Review mode:**

```
question: "When should reviews run during /workflows:work?"
header: "Review mode"
options:
  - label: "Bulk (Default)"
    description: "Review runs once at the end of all tasks. Faster, less interruption."
  - label: "Inline"
    description: "Review runs after each task. Slower, but catches issues earlier."
  - label: "Both"
    description: "Inline review per task AND bulk review at the end."
```

## Step 4: Build Agent List and Write File

**Stack-specific agents:**
- Laravel/PHP -> `rabak-laravel-reviewer`
- Vue/Nuxt -> `rabak-vue-reviewer`
- React/Next.js/Angular/TypeScript/JavaScript -> `rabak-typescript-reviewer`
- NestJS -> `rabak-nest-reviewer, rabak-typescript-reviewer`
- Java -> `rabak-java-reviewer`
- Python -> `rabak-python-reviewer`
- Rust/Go/General -> (none)

**Always-on baseline agent:**
- Constitution and repo standards -> `constitution-guardian`

**Focus area agents:**
- Security -> `security-sentinel`
- Performance -> `performance-oracle`
- Architecture -> `architecture-strategist`
- Code simplicity -> `code-simplicity-reviewer`

**Depth:**
- Thorough: stack + `constitution-guardian` + selected focus areas
- Fast: stack + `constitution-guardian` + `code-simplicity-reviewer`
- Comprehensive: all above + `git-history-analyzer, data-integrity-guardian, agent-native-reviewer`

**Plan review agents:** stack-specific reviewer + `constitution-guardian` + `code-simplicity-reviewer`.

**Execution settings:**
- `tdd_enabled`: false (default) or true (enables TDD mode in execution agent template)
- `review_mode`: "bulk" (default), "inline", or "both" (controls per-task review in workflows:work)

Write `compound-engineering.local.md`:

```markdown
---
review_agents: [{computed agent list}]
plan_review_agents: [{computed plan agent list}]
tdd_enabled: false
review_mode: bulk
---

# Review Context

Add project-specific review instructions here.
These notes are passed to all review agents during /workflows-review and /workflows-work.

Examples:
- "We use Turbo Frames heavily -- check for frame-busting issues"
- "Our API is public -- extra scrutiny on input validation"
- "Performance-critical: we serve 10k req/s on this endpoint"
```

## Step 5: Confirm

```
Saved to compound-engineering.local.md

Stack:        {type}
Review depth: {depth}
Agents:       {count} configured
              {agent list, one per line}

Tip: Edit the "Review Context" section to add project-specific instructions.
     Re-run this setup anytime to reconfigure.
```
