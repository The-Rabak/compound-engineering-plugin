#!/usr/bin/env bash
set -euo pipefail

: "${FAKE_OV_ROOT:?FAKE_OV_ROOT must be set}"
: "${FAKE_OV_LOG:?FAKE_OV_LOG must be set}"

mkdir -p "$(dirname "$FAKE_OV_LOG")"
touch "$FAKE_OV_LOG"

if [[ -n "${FAKE_OV_ENV_SNAPSHOT:-}" ]]; then
  env | sort > "$FAKE_OV_ENV_SNAPSHOT"
fi

OV_GLOBAL_AGENTS_DIR="$FAKE_OV_ROOT/agents"
OV_GLOBAL_AGENTS_URI="viking://resources/_global/agents"
OV_GLOBAL_SKILLS_DIR="$FAKE_OV_ROOT/skills"
OV_GLOBAL_SKILLS_URI="viking://resources/_global/skills"

ov_ensure_running() {
  return 0
}

ov_brief() {
  return 0
}

ov_register_global_agent() {
  local name="$1"
  local source_file="$2"
  mkdir -p "$OV_GLOBAL_AGENTS_DIR"
  cp "$source_file" "$OV_GLOBAL_AGENTS_DIR/$name.md"
  printf 'agent\t%s\t%s\n' "$name" "$source_file" >> "$FAKE_OV_LOG"
}

ov_register_global_skill() {
  local name="$1"
  local source_file="$2"
  mkdir -p "$OV_GLOBAL_SKILLS_DIR"
  cp "$source_file" "$OV_GLOBAL_SKILLS_DIR/$name.md"
  printf 'skill\t%s\t%s\n' "$name" "$source_file" >> "$FAKE_OV_LOG"
}

_ov_ensure_uri_dir() {
  local uri="$1"
  local relative="${uri#viking://resources/_global/}"
  mkdir -p "$FAKE_OV_ROOT/$relative"
}

_ov_reset_uri() {
  local uri="$1"
  local relative="${uri#viking://resources/_global/}"
  rm -rf "$FAKE_OV_ROOT/$relative" "$FAKE_OV_ROOT/$relative.md"
}

_ov_add_resource() {
  local source_file="$1"
  shift

  local parent=""
  while (($#)); do
    case "$1" in
      --parent)
        parent="$2"
        shift 2
        ;;
      *)
        echo "Unexpected argument: $1" >&2
        return 1
        ;;
    esac
  done

  if [[ -z "$parent" ]]; then
    echo "Missing --parent for _ov_add_resource" >&2
    return 1
  fi

  local relative="${parent#viking://resources/_global/}"
  mkdir -p "$FAKE_OV_ROOT/$relative"
  local target_file="$FAKE_OV_ROOT/$relative/$(basename "$source_file")"
  if [[ "$source_file" != "$target_file" ]]; then
    cp "$source_file" "$target_file"
  fi
  printf 'resource\t%s\t%s\n' "$parent" "$source_file" >> "$FAKE_OV_LOG"
}

_ov_rebuild_global_manifest() {
  printf 'rebuild\tglobal-manifest\n' >> "$FAKE_OV_LOG"
}
