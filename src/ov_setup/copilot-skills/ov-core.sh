#!/usr/bin/env bash
# ~/.copilot-skills/ov-core.sh
# OpenViking shell library for Copilot CLI agents
# Source this in any script: source ~/.copilot-skills/ov-core.sh

set -euo pipefail

# ──────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────
OV_HOST="${OV_HOST:-127.0.0.1}"
OV_PORT="${OV_PORT:-1933}"
OV_BASE="http://${OV_HOST}:${OV_PORT}"
OV_API_KEY="${OV_API_KEY:-$(cat ~/.openviking/.api_key 2>/dev/null || echo '')}"
OV_WORKSPACE="${OV_WORKSPACE:-$HOME/openviking_workspace}"

# ──────────────────────────────────────────────────────
# RESILIENCE CONFIG
# ──────────────────────────────────────────────────────
OV_RETRY_MAX="${OV_RETRY_MAX:-5}"
OV_RETRY_DELAY=30
OV_CURL_TIMEOUT=60
OV_RETRY_READY_MAX_WAIT="${OV_RETRY_READY_MAX_WAIT:-1800}"
OV_ADD_WAIT_TIMEOUT="${OV_ADD_WAIT_TIMEOUT:-21600}"
OV_WAIT_POLL_INTERVAL="${OV_WAIT_POLL_INTERVAL:-10}"
OV_WAIT_STALL_MAX="${OV_WAIT_STALL_MAX:-300}"

# ──────────────────────────────────────────────────────
# PROJECT DETECTION (dynamic, based on cwd)
# ──────────────────────────────────────────────────────
ov_detect_project() {
  local root="${1:-$(pwd)}"
  local dir="$root"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.git" ]] ||
      [[ -f "$dir/package.json" ]] ||
      [[ -f "$dir/Cargo.toml" ]] ||
      [[ -f "$dir/pyproject.toml" ]] ||
      [[ -f "$dir/go.mod" ]]; then
      basename "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  basename "$root"
}

OV_PROJECT="${OV_PROJECT:-$(ov_detect_project)}"
OV_PROJECT_URI="viking://resources/${OV_PROJECT}"
OV_MEMORY_URI="viking://memories/${OV_PROJECT}"
OV_SKILLS_URI="viking://skills/${OV_PROJECT}"
OV_GLOBAL_DIR="${OV_WORKSPACE}/global"
OV_GLOBAL_AGENTS_DIR="${OV_GLOBAL_DIR}/agents"
OV_GLOBAL_SKILLS_DIR="${OV_GLOBAL_DIR}/skills"
OV_GLOBAL_ROOT_URI="viking://resources/_global"
OV_GLOBAL_RESOURCES_URI="${OV_GLOBAL_ROOT_URI}"
OV_GLOBAL_SKILLS_URI="${OV_GLOBAL_ROOT_URI}/skills"
OV_GLOBAL_AGENTS_URI="${OV_GLOBAL_ROOT_URI}/agents"

OV_AGENT_SOURCE_DIR="${OV_AGENT_SOURCE_DIR:-$HOME/.copilot-skills/agents}"
OV_SKILL_SOURCE_DIR="${OV_SKILL_SOURCE_DIR:-$HOME/.copilot-skills/skills}"

# ──────────────────────────────────────────────────────
# INTERNAL: nullglob save/restore helpers
# shopt -p nullglob exits 1 when the option is OFF,
# which kills the script under set -e. Always use these.
# ──────────────────────────────────────────────────────
_ov_nullglob_save() {
  # prints "shopt -s nullglob" or "shopt -u nullglob" — always exits 0
  shopt -p nullglob || true
}

_ov_nullglob_restore() {
  eval "$1"
}

# ──────────────────────────────────────────────────────
# SERVER STATUS
# ──────────────────────────────────────────────────────

ov_port_open() {
  nc -z -w 2 "${OV_HOST}" "${OV_PORT}" 2>/dev/null
}

ov_is_running() {
  curl -sS -o /dev/null -w "%{http_code}" \
    --max-time "${OV_CURL_TIMEOUT}" \
    "${OV_BASE}/health" 2>/dev/null | grep -q "200"
}

ov_is_ready() {
  ov_port_open && ov_is_running
}

ov_ensure_running() {
  if ! ov_is_ready; then
    if ov_port_open; then
      echo "[ov] Port ${OV_PORT} open but HTTP unresponsive (possible event-loop hang)." >&2
      echo "[ov] Waiting up to 30s for server to recover..." >&2
      local waited=0
      while [[ $waited -lt 30 ]]; do
        sleep 3
        waited=$((waited + 3))
        if ov_is_running; then
          echo "[ov] Server recovered after ${waited}s." >&2
          return 0
        fi
      done
      echo "[ov] Server still unresponsive after 30s. Check ${OV_WORKSPACE}/server.log" >&2
      return 1
    fi

    echo "[ov] Server not running. Starting..." >&2
    nohup openviking-server >"${OV_WORKSPACE}/server.log" 2>&1 &
    sleep 3
    local waited=0
    while [[ $waited -lt 15 ]]; do
      if ov_is_running; then
        echo "[ov] Server started on ${OV_BASE} (after ${waited}s)." >&2
        return 0
      fi
      sleep 2
      waited=$((waited + 2))
    done
    echo "[ov] ERROR: Failed to start server. Check ${OV_WORKSPACE}/server.log" >&2
    return 1
  fi
}

# ──────────────────────────────────────────────────────
# RETRY WRAPPER
# ──────────────────────────────────────────────────────
_ov_retry() {
  local max="$1"
  local delay="$2"
  shift 2
  local attempt=1
  local current_delay="$delay"

  while [[ $attempt -le $max ]]; do
    if "$@"; then
      return 0
    fi
    local exit_code=$?
    if [[ $attempt -eq $max ]]; then
      echo "[ov] Command failed after ${max} attempts: $*" >&2
      return $exit_code
    fi

    # Preserve long headroom for server recovery without blindly retrying
    # add-resource repeatedly.
    local waited=0
    local interval=5
    if ! ov_is_ready; then
      echo "[ov] Attempt ${attempt}/${max} failed; server not ready. Waiting up to ${OV_RETRY_READY_MAX_WAIT}s..." >&2
      while [[ $waited -lt $OV_RETRY_READY_MAX_WAIT ]]; do
        if ov_is_ready; then
          echo "[ov] Server recovered after ${waited}s." >&2
          break
        fi
        sleep "$interval"
        waited=$((waited + interval))
        [[ $interval -lt 60 ]] && interval=$((interval + 5))
      done
    fi

    echo "[ov] Attempt ${attempt}/${max} failed. Retrying in ${current_delay}s..." >&2
    sleep "$current_delay"
    current_delay=$((current_delay * 2))
    [[ $current_delay -gt 300 ]] && current_delay=300
    attempt=$((attempt + 1))
  done
}

# ──────────────────────────────────────────────────────
# OV ADD-RESOURCE WRAPPER
# ──────────────────────────────────────────────────────
_ov_add_resource() {
  ov_ensure_running || return 1
  local args=("$@")
  local add_args=()
  local has_wait=0
  local wait_timeout="${OV_ADD_WAIT_TIMEOUT}"
  local i=0
  while [[ $i -lt ${#args[@]} ]]; do
    if [[ "${args[$i]}" == "--wait" ]]; then
      has_wait=1
    elif [[ "${args[$i]}" == "--timeout" ]]; then
      if [[ $((i + 1)) -lt ${#args[@]} ]]; then
        wait_timeout="${args[$((i + 1))]}"
      fi
      i=$((i + 1))
    else
      add_args+=("${args[$i]}")
    fi
    i=$((i + 1))
  done
  _ov_retry "${OV_RETRY_MAX}" "${OV_RETRY_DELAY}" \
    ov add-resource "${add_args[@]}"
  if [[ $has_wait -eq 1 ]]; then
    _ov_wait_for_queue_idle "${wait_timeout}"
  fi
}

_ov_wait_for_queue_idle() {
  local timeout="${1:-$OV_ADD_WAIT_TIMEOUT}"
  local poll="${OV_WAIT_POLL_INTERVAL}"
  local elapsed=0
  local stale_for=0
  local last_state=""
  echo "[ov] Waiting for semantic/embedding queues (timeout=${timeout}s)..." >&2

  while [[ $elapsed -lt $timeout ]]; do
    local payload
    payload="$(curl -sS --max-time "${OV_CURL_TIMEOUT}" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: ${OV_API_KEY}" \
      "${OV_BASE}/api/v1/observer/queue" 2>/dev/null || true)"
    if [[ -n "$payload" ]]; then
      local counts
      counts="$(echo "$payload" | python3 - <<'PY'
import json, re, sys
raw = sys.stdin.read()
try:
    obj = json.loads(raw)
    table = (obj.get("result") or {}).get("status", "")
except Exception:
    print("NA NA")
    raise SystemExit(0)
m = re.search(r"\|\s*TOTAL\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|", table)
if not m:
    print("NA NA")
else:
    print(m.group(1), m.group(2))
PY
)"
      local pending="${counts%% *}"
      local in_progress="${counts##* }"
      if [[ "$pending" != "NA" && "$in_progress" != "NA" ]]; then
        echo "[ov] Queue status: pending=${pending}, in_progress=${in_progress} (${elapsed}s/${timeout}s)" >&2
        if [[ "$pending" -eq 0 && "$in_progress" -eq 0 ]]; then
          return 0
        fi
        local state="${pending}:${in_progress}"
        if [[ "$state" == "$last_state" ]]; then
          stale_for=$((stale_for + poll))
        else
          stale_for=0
          last_state="$state"
        fi
        if [[ $stale_for -ge $OV_WAIT_STALL_MAX ]]; then
          echo "[ov] Queue state unchanged for ${stale_for}s; proceeding with warning." >&2
          return 0
        fi
      fi
    fi
    sleep "$poll"
    elapsed=$((elapsed + poll))
  done

  echo "[ov] Timeout waiting for queue drain after ${timeout}s." >&2
  return 1
}

_ov_ensure_uri_dir() {
  local uri="$1"
  ov_ensure_running || return 1
  if ! ov ls "$uri" >/dev/null 2>&1; then
    ov mkdir "$uri" >/dev/null 2>&1
  fi
}

_ov_reset_uri() {
  local uri="$1"
  ov_ensure_running || return 1
  ov rm "$uri" --recursive >/dev/null 2>&1 || true
}

_ov_ensure_global_root() {
  _ov_ensure_uri_dir "$OV_GLOBAL_ROOT_URI"
}

OV_INDEX_INCLUDE_GLOB="*.md,*.yaml,*.yml,*.json,*.txt,*.sh,scripts/*"

_ov_normalize_extensionless_scripts() {
  local root="$1"
  while IFS= read -r f; do
    local dst="${f}.sh"
    if [[ ! -f "$dst" ]]; then
      cp "$f" "$dst"
    fi
  done < <(find "$root" -type f -path "*/scripts/*" ! -name '*.*' | sort)
}

# ──────────────────────────────────────────────────────
# HTTP HELPERS
# ──────────────────────────────────────────────────────
_ov_curl() {
  local method="$1"
  local endpoint="$2"
  shift 2
  _ov_retry "${OV_RETRY_MAX}" "${OV_RETRY_DELAY}" \
    curl -sS -X "$method" \
      "${OV_BASE}${endpoint}" \
      --max-time "${OV_CURL_TIMEOUT}" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: ${OV_API_KEY}" \
      "$@"
}

_ov_post() { _ov_curl POST "$@"; }
_ov_get() { _ov_curl GET "$@"; }
_ov_put() { _ov_curl PUT "$@"; }
_ov_delete() { _ov_curl DELETE "$@"; }

# ──────────────────────────────────────────────────────
# INTERNAL: Recursively collect all indexable files
# under a skill dir at any depth
# ──────────────────────────────────────────────────────
_ov_find_skill_files() {
  find "$1" -type f \( \
    -name "*.md" -o -name "*.yaml" -o -name "*.yml" \
    -o -name "*.json" -o -name "*.txt" -o -name "*.sh" \
    -o -path "*/scripts/*" \
  \) | sort
}

# ──────────────────────────────────────────────────────
# INTERNAL: Generate a _SKILL_INDEX.md for a skill dir.
# This is the OV context anchor — it ties every nested
# file back to its parent skill so semantic search stays
# scoped correctly even across arbitrary subdir depth.
# ──────────────────────────────────────────────────────
_ov_generate_skill_index() {
  local skill_name="$1"
  local skill_dest="$2"

  local index_file="${skill_dest}/_SKILL_INDEX.md"

  local skill_md="${skill_dest}/SKILL.md"
  local description="(no SKILL.md found)"
  if [[ -f "$skill_md" ]]; then
    description="$(head -1 "$skill_md" | sed 's/^#\s*//')"
  fi

  {
    echo "# Skill Index: ${skill_name}"
    echo ""
    echo "> This file is auto-generated. It anchors all nested content"
    echo "> to the skill '${skill_name}' for semantic search relevance."
    echo ""
    echo "**Skill:** ${skill_name}"
    echo "**Description:** ${description}"
    echo ""
    echo "## Content Map"
    echo ""

    local last_dir=""
    while IFS= read -r f; do
      local fname
      fname="$(basename "$f")"
      [[ "$fname" == "_SKILL_INDEX.md" ]] && continue

      local rel_path="${f#${skill_dest}/}"
      local file_dir
      file_dir="$(dirname "$rel_path")"

      if [[ "$file_dir" != "$last_dir" ]]; then
        if [[ "$file_dir" == "." ]]; then
          echo "### Root"
        else
          echo "### ${file_dir}/"
        fi
        last_dir="$file_dir"
        echo ""
      fi

      local first_line
      first_line="$(head -1 "$f" 2>/dev/null | sed 's/^#\s*//' | tr -d '\r')"
      echo "- **${fname}**: ${first_line}"
      echo "  - _Skill context: ${skill_name}_"
      echo "  - _Path: ${rel_path}_"
      echo ""
    done < <(_ov_find_skill_files "$skill_dest")

  } >"$index_file"
}

# ──────────────────────────────────────────────────────
# GLOBAL: INDEX ALL EXISTING AGENTS & SKILLS
# ──────────────────────────────────────────────────────

ov_index_global_agents() {
  local source_dir="${1:-$OV_AGENT_SOURCE_DIR}"
  mkdir -p "$OV_GLOBAL_AGENTS_DIR"

  if [[ ! -d "$source_dir" ]]; then
    echo "[ov] Agent source dir not found: ${source_dir}" >&2
    echo "[ov] Set OV_AGENT_SOURCE_DIR or pass the path." >&2
    return 1
  fi

  echo "[ov] Indexing global agents from ${source_dir}..." >&2
  local count=0
  local old_nullglob
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob

  for f in "$source_dir"/*.md "$source_dir"/*.yaml "$source_dir"/*.yml \
    "$source_dir"/*.json "$source_dir"/*.txt; do
    cp "$f" "$OV_GLOBAL_AGENTS_DIR/"
    count=$((count + 1))
  done

  for d in "$source_dir"/*/; do
    local agent_name
    agent_name="$(basename "$d")"
    rm -rf "${OV_GLOBAL_AGENTS_DIR:?}/${agent_name}"
    cp -r "$d" "${OV_GLOBAL_AGENTS_DIR}/${agent_name}"
    count=$((count + 1))
  done

  _ov_nullglob_restore "$old_nullglob"

  _ov_ensure_global_root
  _ov_reset_uri "$OV_GLOBAL_AGENTS_URI"
  _ov_add_resource "$OV_GLOBAL_AGENTS_DIR" --parent "$OV_GLOBAL_ROOT_URI" --include "$OV_INDEX_INCLUDE_GLOB"
  echo "[ov] Indexed ${count} agent definitions globally." >&2
  _ov_rebuild_global_manifest
}

ov_index_global_skills() {
  local source_dir="${1:-$OV_SKILL_SOURCE_DIR}"
  mkdir -p "$OV_GLOBAL_SKILLS_DIR"

  if [[ ! -d "$source_dir" ]]; then
    echo "[ov] Skill source dir not found: ${source_dir}" >&2
    return 1
  fi

  echo "[ov] Indexing global skills from ${source_dir}..." >&2
  local count=0
  local old_nullglob
  local skill_dirs=()
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob

  if [[ -f "${source_dir}/SKILL.md" ]]; then
    skill_dirs+=("${source_dir}")
  else
    for d in "$source_dir"/*/; do
      skill_dirs+=("${d%/}")
    done
  fi

  for d in "${skill_dirs[@]}"; do
    local skill_name
    skill_name="$(basename "$d")"
    local dest="${OV_GLOBAL_SKILLS_DIR}/${skill_name}"

    echo "[ov]   + ${skill_name}" >&2

    rm -rf "$dest"
    cp -r "$d" "$dest"
    _ov_normalize_extensionless_scripts "$dest"

    _ov_generate_skill_index "$skill_name" "$dest"

    count=$((count + 1))
  done

  _ov_nullglob_restore "$old_nullglob"
  _ov_ensure_global_root
  _ov_reset_uri "$OV_GLOBAL_SKILLS_URI"
  _ov_add_resource "$OV_GLOBAL_SKILLS_DIR" --parent "$OV_GLOBAL_ROOT_URI" --include "$OV_INDEX_INCLUDE_GLOB"
  echo "[ov] Indexed ${count} skill definitions globally." >&2
  _ov_rebuild_global_manifest
}

ov_sync_global() {
  echo "[ov] Full global sync..." >&2
  ov_index_global_agents
  ov_index_global_skills
  _ov_wait_for_queue_idle "${OV_ADD_WAIT_TIMEOUT}"
}

# ──────────────────────────────────────────────────────
# GLOBAL: MANIFEST
# ──────────────────────────────────────────────────────

_ov_rebuild_global_manifest() {
  local manifest="${OV_GLOBAL_DIR}/MANIFEST.md"
  cat >"$manifest" <<'HEADER'
# Global Agent & Skill Manifest

This file is auto-generated. It lists all globally available agents
and skills that can be loaded into any project context on demand.

## Agents
HEADER

  local old_nullglob
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob

  if [[ -d "$OV_GLOBAL_AGENTS_DIR" ]]; then
    for f in "$OV_GLOBAL_AGENTS_DIR"/*.md \
      "$OV_GLOBAL_AGENTS_DIR"/*.yaml \
      "$OV_GLOBAL_AGENTS_DIR"/*.yml; do
      local name
      name="$(basename "$f" | sed 's/\.[^.]*$//')"
      local first_line
      first_line="$(head -1 "$f" | sed 's/^#\s*//')"
      echo "- **${name}**: ${first_line}" >>"$manifest"
    done
    for d in "$OV_GLOBAL_AGENTS_DIR"/*/; do
      local name
      name="$(basename "$d")"
      echo "- **${name}/** (multi-file agent)" >>"$manifest"
    done
  fi

  cat >>"$manifest" <<'MID'

## Skills
MID

  if [[ -d "$OV_GLOBAL_SKILLS_DIR" ]]; then
    for d in "$OV_GLOBAL_SKILLS_DIR"/*/; do
      local name
      name="$(basename "$d")"
      local skill_md="${d}SKILL.md"
      local first_line="(no description)"
      if [[ -f "$skill_md" ]]; then
        first_line="$(head -1 "$skill_md" | sed 's/^#\s*//')"
      fi
      local total_nested
      total_nested="$(find "$d" -mindepth 2 -type f | wc -l | tr -d ' ')"
      local subdir_list
      subdir_list="$(find "$d" -mindepth 1 -maxdepth 1 -type d \
        -exec basename {} \; | sort | tr '\n' ',' | sed 's/,$//')"
      local extras=""
      if [[ -n "$subdir_list" ]]; then
        extras=" — \`${subdir_list}\` (${total_nested} nested files)"
      fi
      echo "- **${name}**: ${first_line}${extras}" >>"$manifest"
    done
  fi

  _ov_nullglob_restore "$old_nullglob"

  cat >>"$manifest" <<'FOOTER'

## Usage

To load any of the above into the current session, the agent should run:

    ov_load_global_agent "agent-name"
    ov_load_global_skill "skill-name"

To search across all global definitions:

    ov_search_global "query"
FOOTER

  _ov_ensure_global_root
  _ov_reset_uri "${OV_GLOBAL_ROOT_URI}/MANIFEST"
  _ov_add_resource "$manifest" --parent "$OV_GLOBAL_ROOT_URI" 2>/dev/null
  echo "[ov] Global manifest rebuilt: ${manifest}" >&2
}

# ──────────────────────────────────────────────────────
# GLOBAL: RETRIEVAL
# ──────────────────────────────────────────────────────

ov_search_global() {
  local query="$1"
  local top_k="${2:-5}"
  ov_search "$query" "$OV_GLOBAL_RESOURCES_URI" "$top_k"
}

# Recursively emit all readable files from an agent directory,
# mirroring the section-per-subdir format used by ov_load_global_skill.
_ov_load_agent_dir() {
  local dir="$1"
  local name="$2"
  local last_fdir=""

  while IFS= read -r f; do
    local rel="${f#${dir}/}"
    local fdir
    fdir="$(dirname "$rel")"
    local fname
    fname="$(basename "$rel")"

    if [[ "$fdir" != "$last_fdir" && "$fdir" != "." ]]; then
      echo ""
      echo "---"
      echo "# ${fdir}/"
      echo "> _Part of agent: **${name}**_"
      last_fdir="$fdir"
    fi

    echo ""
    echo "## ${fname}"
    cat "$f"
  done < <(find "$dir" -type f \( \
    -name "*.md" -o -name "*.yaml" -o -name "*.yml" \
    -o -name "*.json" -o -name "*.txt" -o -name "*.sh" \
  \) | sort)
}

ov_load_global_agent() {
  local name="$1"

  # Agents are stored as <name>.agent.md (or bare <name>.md for legacy).
  # Try both stems before falling back to a semantic search.
  for stem in "${name}" "${name}.agent"; do
    for ext in md yaml yml json txt; do
      local file="${OV_GLOBAL_AGENTS_DIR}/${stem}.${ext}"
      if [[ -f "$file" ]]; then
        cat "$file"
        return 0
      fi
    done
  done

  # Multi-file agent directories: try <name>/ and <name>.agent/
  for stem in "${name}" "${name}.agent"; do
    local dir="${OV_GLOBAL_AGENTS_DIR}/${stem}"
    if [[ -d "$dir" ]]; then
      echo "# Agent: ${name}"
      echo ""
      _ov_load_agent_dir "$dir" "$name"
      return 0
    fi
  done

  echo "[ov] No exact match for agent '${name}', searching..." >&2
  ov_search "$name" "$OV_GLOBAL_AGENTS_URI" 3
}

ov_load_global_skill() {
  local name="$1"
  local show_refs="${2:-all}" # all | skill-only | refs-only
  local skill_dir="${OV_GLOBAL_SKILLS_DIR}/${name}"

  if [[ ! -d "$skill_dir" ]]; then
    echo "[ov] No exact match for skill '${name}', searching..." >&2
    ov_search "$name" "$OV_GLOBAL_SKILLS_URI" 3
    return 0
  fi

  if [[ "$show_refs" != "refs-only" ]]; then
    local skill_md="${skill_dir}/SKILL.md"
    if [[ -f "$skill_md" ]]; then
      cat "$skill_md"
    else
      local first_md
      first_md="$(find "$skill_dir" -maxdepth 1 -name '*.md' \
        ! -name '_SKILL_INDEX.md' | sort | head -1)"
      [[ -n "$first_md" ]] && cat "$first_md"
    fi
  fi

  [[ "$show_refs" == "skill-only" ]] && return 0

  local last_dir=""
  while IFS= read -r f; do
    local rel="${f#${skill_dir}/}"
    local fdir
    fdir="$(dirname "$rel")"
    local fname
    fname="$(basename "$rel")"

    [[ "$fdir" == "." ]] && continue
    [[ "$fname" == "_SKILL_INDEX.md" ]] && continue

    if [[ "$fdir" != "$last_dir" ]]; then
      echo ""
      echo "---"
      echo "# ${fdir}/"
      echo "> _Part of skill: **${name}**_"
      last_dir="$fdir"
    fi

    echo ""
    echo "## ${fname}"
    cat "$f"
  done < <(_ov_find_skill_files "$skill_dir")
}

ov_list_global_agents() {
  echo "Global Agents:" >&2
  local old_nullglob
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob
  if [[ -d "$OV_GLOBAL_AGENTS_DIR" ]]; then
    for f in "$OV_GLOBAL_AGENTS_DIR"/*.md "$OV_GLOBAL_AGENTS_DIR"/*.yaml \
      "$OV_GLOBAL_AGENTS_DIR"/*.yml "$OV_GLOBAL_AGENTS_DIR"/*.json; do
      local raw_name
      raw_name="$(basename "$f" | sed 's/\.[^.]*$//')"
      # Strip trailing .agent suffix so display name matches what ov_load_global_agent accepts
      echo "  - ${raw_name%.agent}"
    done
    for d in "$OV_GLOBAL_AGENTS_DIR"/*/; do
      local raw_name
      raw_name="$(basename "$d")"
      echo "  - ${raw_name%.agent} (multi-file)"
    done
  fi
  _ov_nullglob_restore "$old_nullglob"
}

ov_list_global_skills() {
  echo "Global Skills:" >&2
  local old_nullglob
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob
  if [[ -d "$OV_GLOBAL_SKILLS_DIR" ]]; then
    for d in "$OV_GLOBAL_SKILLS_DIR"/*/; do
      local skill_name
      skill_name="$(basename "$d")"
      echo "  - ${skill_name}"
      for sd in "$d"/*/; do
        local sub_name
        sub_name="$(basename "$sd")"
        local file_count
        file_count="$(_ov_find_skill_files "$sd" | wc -l | tr -d ' ')"
        echo "      └─ ${sub_name}/ (${file_count} files)"
      done
    done
  else
    echo "[ov] No skills indexed globally yet." >&2
  fi
  _ov_nullglob_restore "$old_nullglob"
}

ov_global_progress() {
  local base="${OV_WORKSPACE}/viking/default/resources/_global/skills"
  if [[ ! -d "$base" ]]; then
    echo "[ov] Global skills directory not found at ${base}" >&2
    return 1
  fi

  python3 - "$base" <<'PY'
from pathlib import Path
import time
import sys

base = Path(sys.argv[1])
skills = sorted([p for p in base.iterdir() if p.is_dir()])
if not skills:
    print("No global skills found.")
    raise SystemExit(0)

rows = []
recent = []
for skill in skills:
    total_dirs = sum(1 for p in skill.rglob("*") if p.is_dir()) + 1
    abstracts = sum(1 for _ in skill.rglob(".abstract.md"))
    overviews = sum(1 for _ in skill.rglob(".overview.md"))
    den = max(total_dirs * 2, 1)
    progress = (abstracts + overviews) * 100.0 / den
    rows.append((skill.name, total_dirs, abstracts, overviews, progress))

    for p in skill.rglob("*"):
        if p.is_file() and p.name in {".abstract.md", ".overview.md"}:
            recent.append((p.stat().st_mtime, p))

done = sum(1 for r in rows if r[4] >= 99.9)
remaining = len(rows) - done
print(f"Global skills: {len(rows)} total | {done} done | {remaining} remaining")

if recent:
    mtime, path = max(recent, key=lambda x: x[0])
    # .../_global/skills/<skill>/...
    parts = path.parts
    try:
      idx = parts.index("skills")
      current_skill = parts[idx + 1]
    except Exception:
      current_skill = path.parent.name
    print(f"Likely current skill: {current_skill} (last semantic write {time.strftime('%H:%M:%S', time.localtime(mtime))})")

print("")
print("Remaining skills (lowest progress first):")
for name, total, a, o, p in sorted((r for r in rows if r[4] < 99.9), key=lambda x: x[4])[:15]:
    print(f"  - {name:28} {p:5.1f}%  ({a + o}/{max(total*2,1)} layer files)")
PY
}

# ──────────────────────────────────────────────────────
# GLOBAL: REGISTRATION
# ──────────────────────────────────────────────────────

ov_register_global_agent() {
  local name="$1"
  local source_file="$2"
  mkdir -p "$OV_GLOBAL_AGENTS_DIR"
  cp "$source_file" "${OV_GLOBAL_AGENTS_DIR}/${name}.md"
  _ov_ensure_uri_dir "$OV_GLOBAL_AGENTS_URI"
  _ov_reset_uri "${OV_GLOBAL_AGENTS_URI}/${name}"
  _ov_add_resource "${OV_GLOBAL_AGENTS_DIR}/${name}.md" --parent "$OV_GLOBAL_AGENTS_URI" --wait 2>/dev/null
  _ov_rebuild_global_manifest
  echo "[ov] Global agent '${name}' registered." >&2
}

ov_register_global_skill() {
  local name="$1"
  local source_file="$2"
  mkdir -p "$OV_GLOBAL_SKILLS_DIR"
  cp "$source_file" "${OV_GLOBAL_SKILLS_DIR}/${name}.md"
  _ov_ensure_uri_dir "$OV_GLOBAL_SKILLS_URI"
  _ov_reset_uri "${OV_GLOBAL_SKILLS_URI}/${name}"
  _ov_add_resource "${OV_GLOBAL_SKILLS_DIR}/${name}.md" --parent "$OV_GLOBAL_SKILLS_URI" --wait 2>/dev/null
  _ov_rebuild_global_manifest
  echo "[ov] Global skill '${name}' registered." >&2
}

# ──────────────────────────────────────────────────────
# CONTEXT: RETRIEVAL
# ──────────────────────────────────────────────────────

ov_search() {
  local query="$1"
  local scope="${2:-$OV_PROJECT_URI}"
  local top_k="${3:-5}"

  ov search "$query" --uri "$scope" --node-limit "$top_k" 2>/dev/null
}

ov_grep() {
  local pattern="$1"
  local scope="${2:-$OV_PROJECT_URI}"
  ov grep "$pattern" --uri "$scope" 2>/dev/null
}

ov_ls() {
  local path="${1:-$OV_PROJECT_URI}"
  ov ls "$path" 2>/dev/null
}

ov_tree() {
  local depth="${1:-3}"
  ov tree "$OV_PROJECT_URI" -L "$depth" 2>/dev/null
}

ov_read() {
  local uri="$1"
  _ov_get "/api/v1/resource?uri=${uri}"
}

# ──────────────────────────────────────────────────────
# CONTEXT: STORAGE
# ──────────────────────────────────────────────────────

ov_add_local() {
  local path="$1"
  local abs_path
  abs_path="$(realpath "$path")"
  echo "[ov] Indexing ${abs_path} into ${OV_PROJECT}..." >&2
  _ov_add_resource "$abs_path" --wait
}

ov_add_url() {
  local url="$1"
  echo "[ov] Indexing ${url} into ${OV_PROJECT}..." >&2
  _ov_add_resource "$url" --wait
}

ov_add_text() {
  local name="$1"
  local content="$2"
  local tmp
  tmp=$(mktemp "/tmp/ov-${OV_PROJECT}-${name}-XXXX.md")
  echo "$content" >"$tmp"
  _ov_add_resource "$tmp" --wait
  rm -f "$tmp"
}

ov_note() {
  local note_name="$1"
  local content="$2"
  local note_dir="${OV_WORKSPACE}/notes/${OV_PROJECT}"
  mkdir -p "$note_dir"
  echo "$content" >"${note_dir}/${note_name}.md"
  _ov_add_resource "${note_dir}/${note_name}.md" --wait
  echo "[ov] Note '${note_name}' saved and indexed." >&2
}

# ──────────────────────────────────────────────────────
# CONTEXT: UPDATES
# ──────────────────────────────────────────────────────

ov_refresh() {
  local uri="${1:-$OV_PROJECT_URI}"
  echo "[ov] Refreshing ${uri}..." >&2
  ov refresh "$uri" --wait 2>/dev/null
}

ov_remove() {
  local uri="$1"
  echo "[ov] Removing ${uri}..." >&2
  ov rm "$uri" 2>/dev/null
}

ov_sync() {
  local project_root
  project_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  echo "[ov] Full sync of ${project_root}..." >&2
  ov_add_local "$project_root"
}

# ──────────────────────────────────────────────────────
# MEMORY: SESSION PERSISTENCE
# ──────────────────────────────────────────────────────

ov_remember() {
  local key="$1"
  local value="$2"
  local memory_dir="${OV_WORKSPACE}/memories/${OV_PROJECT}"
  mkdir -p "$memory_dir"

  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat >>"${memory_dir}/${key}.jsonl" <<EOF
{"ts":"${ts}","key":"${key}","value":$(echo "$value" | jq -Rs .)}
EOF

  echo "# ${key} (last updated: ${ts})" >"${memory_dir}/${key}.md"
  echo "" >>"${memory_dir}/${key}.md"
  echo "$value" >>"${memory_dir}/${key}.md"

  _ov_add_resource "${memory_dir}/${key}.md" --wait 2>/dev/null
  echo "[ov] Remembered '${key}' for project '${OV_PROJECT}'." >&2
}

ov_recall() {
  local key="$1"
  local memory_file="${OV_WORKSPACE}/memories/${OV_PROJECT}/${key}.md"
  if [[ -f "$memory_file" ]]; then
    cat "$memory_file"
  else
    echo "[ov] No memory found for key '${key}' in project '${OV_PROJECT}'." >&2
    ov_search "$key" "$OV_MEMORY_URI" 3
  fi
}

ov_recall_all() {
  local memory_dir="${OV_WORKSPACE}/memories/${OV_PROJECT}"
  local old_nullglob
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob
  if [[ -d "$memory_dir" ]]; then
    for f in "$memory_dir"/*.md; do
      echo "=== $(basename "$f" .md) ==="
      cat "$f"
      echo ""
    done
  else
    echo "[ov] No memories found for project '${OV_PROJECT}'." >&2
  fi
  _ov_nullglob_restore "$old_nullglob"
}

ov_forget() {
  local key="$1"
  local memory_dir="${OV_WORKSPACE}/memories/${OV_PROJECT}"
  rm -f "${memory_dir}/${key}.md" "${memory_dir}/${key}.jsonl"
  echo "[ov] Forgot '${key}' for project '${OV_PROJECT}'." >&2
}

# ──────────────────────────────────────────────────────
# SKILLS REGISTRY (project-scoped)
# ──────────────────────────────────────────────────────

ov_register_skill() {
  local skill_name="$1"
  local skill_file="$2"
  local skill_dir="${OV_WORKSPACE}/skills/${OV_PROJECT}"
  mkdir -p "$skill_dir"
  cp "$skill_file" "${skill_dir}/${skill_name}.md"
  _ov_add_resource "${skill_dir}/${skill_name}.md" --wait 2>/dev/null
  echo "[ov] Skill '${skill_name}' registered for project '${OV_PROJECT}'." >&2
}

ov_list_skills() {
  local skill_dir="${OV_WORKSPACE}/skills/${OV_PROJECT}"
  local old_nullglob
  old_nullglob=$(_ov_nullglob_save)
  shopt -s nullglob
  if [[ -d "$skill_dir" ]]; then
    for f in "$skill_dir"/*.md; do
      echo "  - $(basename "$f" .md)"
    done
  else
    echo "[ov] No skills registered for project '${OV_PROJECT}'." >&2
  fi
  _ov_nullglob_restore "$old_nullglob"
}

ov_load_skill() {
  local skill_name="$1"
  local skill_file="${OV_WORKSPACE}/skills/${OV_PROJECT}/${skill_name}.md"
  if [[ -f "$skill_file" ]]; then
    cat "$skill_file"
  else
    echo "[ov] Skill '${skill_name}' not found." >&2
    return 1
  fi
}

# ──────────────────────────────────────────────────────
# CONTEXT SUMMARY (for agent bootstrap)
# ──────────────────────────────────────────────────────

ov_brief() {
  cat <<EOF
================================================
 PROJECT: ${OV_PROJECT}
 ROOT:    $(git rev-parse --show-toplevel 2>/dev/null || pwd)
 URI:     ${OV_PROJECT_URI}
================================================

## Project Resources
$(ov_ls 2>/dev/null | grep -v '^cmd:' || echo "  (none)")

## Project Skills
$(ov_list_skills 2>/dev/null || echo "  (none)")

## Recent Memories
$(ov_recall_all 2>/dev/null || echo "  (none)")

## Global Agents Available
$(ov_list_global_agents 2>/dev/null || echo "  (none)")

## Global Skills Available
$(ov_list_global_skills 2>/dev/null || echo "  (none)")
================================================
EOF
}

# ──────────────────────────────────────────────────────
# EXPORTS
# ──────────────────────────────────────────────────────
export OV_HOST OV_PORT OV_BASE OV_API_KEY OV_WORKSPACE
export OV_RETRY_MAX OV_RETRY_DELAY OV_CURL_TIMEOUT OV_RETRY_READY_MAX_WAIT OV_ADD_WAIT_TIMEOUT OV_WAIT_POLL_INTERVAL OV_WAIT_STALL_MAX
export OV_INDEX_INCLUDE_GLOB
export OV_PROJECT OV_PROJECT_URI OV_MEMORY_URI OV_SKILLS_URI
export OV_GLOBAL_DIR OV_GLOBAL_AGENTS_DIR OV_GLOBAL_SKILLS_DIR
export OV_GLOBAL_ROOT_URI OV_GLOBAL_RESOURCES_URI OV_GLOBAL_SKILLS_URI OV_GLOBAL_AGENTS_URI

export -f ov_detect_project
export -f ov_port_open ov_is_running ov_is_ready ov_ensure_running
export -f _ov_retry _ov_add_resource
export -f _ov_wait_for_queue_idle
export -f _ov_ensure_uri_dir _ov_reset_uri _ov_ensure_global_root
export -f _ov_curl _ov_post _ov_get _ov_put _ov_delete
export -f _ov_nullglob_save _ov_nullglob_restore
export -f _ov_find_skill_files _ov_generate_skill_index _ov_normalize_extensionless_scripts
export -f ov_index_global_agents ov_index_global_skills ov_sync_global
export -f _ov_rebuild_global_manifest
export -f ov_search_global ov_load_global_agent ov_load_global_skill _ov_load_agent_dir
export -f ov_list_global_agents ov_list_global_skills ov_global_progress
export -f ov_register_global_agent ov_register_global_skill
export -f ov_search ov_grep ov_ls ov_tree ov_read
export -f ov_add_local ov_add_url ov_add_text ov_note
export -f ov_refresh ov_remove ov_sync
export -f ov_remember ov_recall ov_recall_all ov_forget
export -f ov_register_skill ov_list_skills ov_load_skill
export -f ov_brief
