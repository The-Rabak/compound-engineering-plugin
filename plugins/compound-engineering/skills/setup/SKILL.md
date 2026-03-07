---
name: setup
description: Configure which review agents run for your project. Auto-detects stack and writes compound-engineering.local.md.
disable-model-invocation: true
---

# Compound Engineering Setup

Interactive setup for `compound-engineering.local.md` -- configures which agents run during `/workflows:review` and `/workflows:work`.

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

- **Laravel:** `[rabak-laravel-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **PHP:** `[rabak-laravel-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Vue/Nuxt:** `[rabak-vue-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **React/Next.js:** `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Angular:** `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **NestJS:** `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **TypeScript:** `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **JavaScript:** `[rabak-typescript-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Python:** `[rabak-python-reviewer, code-simplicity-reviewer, security-sentinel, performance-oracle]`
- **Rust:** `[code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]`
- **Go:** `[code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]`
- **General:** `[code-simplicity-reviewer, security-sentinel, performance-oracle, architecture-strategist]`

### If Customize -> Step 3

## Step 3: Customize (3 questions)

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
    description: "NestJS -- adds TypeScript reviewer"
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
    description: "Over-engineering, YAGNI violations (code-simplicity-reviewer)"
```

**c. Depth:**

```
question: "How thorough should reviews be?"
header: "Depth"
options:
  - label: "Thorough (Recommended)"
    description: "Stack reviewers + all selected focus agents."
  - label: "Fast"
    description: "Stack reviewers + code simplicity only. Less context, quicker."
  - label: "Comprehensive"
    description: "All above + git history, data integrity, agent-native checks."
```

## Step 4: Build Agent List and Write File

**Stack-specific agents:**
- Laravel/PHP -> `rabak-laravel-reviewer`
- Vue/Nuxt -> `rabak-vue-reviewer`
- React/Next.js/Angular/NestJS/TypeScript/JavaScript -> `rabak-typescript-reviewer`
- Python -> `rabak-python-reviewer`
- Rust/Go/General -> (none)

**Focus area agents:**
- Security -> `security-sentinel`
- Performance -> `performance-oracle`
- Architecture -> `architecture-strategist`
- Code simplicity -> `code-simplicity-reviewer`

**Depth:**
- Thorough: stack + selected focus areas
- Fast: stack + `code-simplicity-reviewer` only
- Comprehensive: all above + `git-history-analyzer, data-integrity-guardian, agent-native-reviewer`

**Plan review agents:** stack-specific reviewer + `code-simplicity-reviewer`.

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
These notes are passed to all review agents during /workflows:review and /workflows:work.

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
