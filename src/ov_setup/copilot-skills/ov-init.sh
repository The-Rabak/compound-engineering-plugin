#!/usr/bin/env bash
# ~/.copilot-skills/ov-init.sh
# Usage: ov-init [optional-project-root]

source ~/.copilot-skills/ov-core.sh

PROJECT_ROOT="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PROJECT_NAME="$(ov_detect_project "$PROJECT_ROOT")"

echo "┌──────────────────────────────────────────┐"
echo "│  OpenViking Project Init                 │"
echo "│  Project: ${PROJECT_NAME}"
echo "│  Root:    ${PROJECT_ROOT}"
echo "└──────────────────────────────────────────┘"
echo ""

# 1. Ensure server is up
ov_ensure_running

# 2. Index the project root
echo "[1/4] Indexing project source..."
ov_add_local "$PROJECT_ROOT"

# 3. Look for docs directories and index them separately
for docs_dir in docs doc documentation wiki; do
  if [[ -d "${PROJECT_ROOT}/${docs_dir}" ]]; then
    echo "[2/4] Found ${docs_dir}/, indexing..."
    ov_add_local "${PROJECT_ROOT}/${docs_dir}"
  fi
done

# 4. Create a project manifest memory
echo "[3/4] Creating project manifest..."
MANIFEST=$(
  cat <<EOF
# Project Manifest: ${PROJECT_NAME}

- **Root**: ${PROJECT_ROOT}
- **Detected**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **Git Remote**: $(git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null || echo "N/A")
- **Git Branch**: $(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo "N/A")
- **Languages**: $(find "$PROJECT_ROOT" -maxdepth 3 -type f \
  \( -name "*.py" -o -name "*.ts" -o -name "*.js" \
  -o -name "*.rs" -o -name "*.go" -o -name "*.java" \) \
  -printf '%f\n' 2>/dev/null |
  sed 's/.*\.//' | sort -u | tr '\n' ', ' | sed 's/,$//')
- **Key Files**:
$(find "$PROJECT_ROOT" -maxdepth 2 -type f \
  \( -name "README*" -o -name "package.json" -o -name "Cargo.toml" \
  -o -name "pyproject.toml" -o -name "go.mod" -o -name "Makefile" \
  -o -name "docker-compose*" -o -name "Dockerfile" \) \
  -printf '  - %P\n' 2>/dev/null)
EOF
)
ov_remember "manifest" "$MANIFEST"

# 5. Symlink the copilot instructions into the project
echo "[4/4] Linking copilot instructions..."
INSTRUCTIONS_SRC="${COPILOT_INSTRUCTIONS_SOURCE:-$HOME/.copilot/copilot-instructions.md}"
if [[ ! -f "$INSTRUCTIONS_SRC" ]]; then
  for candidate in \
    "$HOME/.copilot-skills/skills/.copilot-instructions.md" \
    "$HOME/.copilot-skills/.copilot-instructions.md"; do
    if [[ -f "$candidate" ]]; then
      INSTRUCTIONS_SRC="$candidate"
      break
    fi
  done
fi
INSTRUCTIONS_DST="${PROJECT_ROOT}/.copilot-instructions.md"
if [[ -f "$INSTRUCTIONS_SRC" ]] && [[ ! -f "$INSTRUCTIONS_DST" ]]; then
  ln -s "$INSTRUCTIONS_SRC" "$INSTRUCTIONS_DST"
  echo "  Linked .copilot-instructions.md"
  echo "  (add to .gitignore if you don't want it committed)"
fi

echo ""
echo "✓ Done. Run 'source ~/.copilot-skills/ov-core.sh && ov_brief' to verify."
