---
module: Development Environment
date: 2026-02-19
problem_type: build_error
component: development_workflow
symptoms:
  - "macOS watchdog timeout panic after 90+ seconds of no checkins from watchdogd"
  - "Memory compressor segments at 100% of limit (BAD) with 36 swapfiles"
  - "System crash and forced reboot during pip install of camelot-py[cv] with native C++ extension compilation"
  - "Multiple parallel clang/cc1plus processes consuming excessive memory simultaneously"
root_cause: memory_leak
resolution_type: environment_setup
severity: critical
tags: [pip-install, native-compilation, macos-kernel-panic, opencv, apple-silicon, watchdog-timeout, memory-pressure]
---

# Troubleshooting: macOS Kernel Panic During pip Install with Native C Extension Compilation

## Problem

Running `pip install -r requirements.txt` with a package requiring native C extension compilation (`camelot-py[cv]` which depends on OpenCV) caused a macOS kernel panic and forced system reboot on an Apple Silicon Mac. The crash occurred during an automated `/workflows:work` task execution, with no opportunity for manual intervention.

## Environment

- Module: Development Environment
- OS: macOS 15.6 (Darwin 24.6.0)
- Hardware: Mac M3 Max (14 cores)
- Python: 3.x with venv
- Affected Component: pip install / native extension compilation
- Date: 2026-02-19

## Symptoms

- macOS watchdog timeout panic: `no checkins from watchdogd in 90 seconds`
- Memory compressor at critical threshold: `100% of segments limit (BAD) with 36 swapfiles`
- System freeze followed by forced reboot during `pip install`
- Multiple parallel `clang`/`cc1plus` compiler processes running simultaneously
- Kernel panic log showing `com.apple.driver.AppleARMWatchdogTimer` in backtrace

## What Didn't Work

**Direct crash - no prior attempts:** The kernel panic was immediate and unrecoverable. The `pip install` command ran automatically as part of a `/workflows:work` agent task (Task 1.1: Initialize Python Environment). The agent executed `pip install -r requirements.txt` which included `camelot-py[cv]>=0.11.0`. pip began compiling OpenCV C++ extensions from source, spawning multiple parallel compiler processes, and the system crashed before any intervention was possible.

This highlighted a critical issue: automated AI agent workflows that run pip installs can trigger uncontrolled native compilation that exhausts system resources without warning or graceful degradation on macOS.

## Solution

**Primary fix: Remove the problematic dependency entirely.**

```txt
# Before (requirements.txt - caused kernel panic):
llama-parse>=0.5.0
llama-index-core>=0.11.0
llama-index-readers-file>=0.5.0
camelot-py[cv]>=0.11.0          # <-- This compiles OpenCV from source
python-dotenv>=1.0.0
pandas>=2.0.0
pydantic>=2.0.0

# After (requirements.txt - safe):
llama-parse>=0.5.0
llama-index-core>=0.11.0
llama-index-readers-file>=0.5.0
# camelot-py[cv] REMOVED - causes kernel panic from OpenCV compilation
python-dotenv>=1.0.0
pandas>=2.0.0
pydantic>=2.0.0
```

**If native compilation is unavoidable in the future, use these flags:**

```bash
# Single-threaded compilation (prevents memory exhaustion)
MAKEFLAGS="-j1" pip install --no-cache-dir -r requirements.txt

# Force pre-built wheels only (fails gracefully if unavailable)
pip install --only-binary :all: -r requirements.txt

# For AI agents: install packages one at a time
MAKEFLAGS="-j1" pip install --no-cache-dir package-name
```

## Why This Works

**Root Cause:** pip compiles native C/C++ extensions with parallel jobs by default (`make -j<num_cores>`). On the M3 Max with 14 cores, this spawned 14+ simultaneous `clang` processes. C++ compilation is extremely memory-intensive due to template instantiation and optimization passes. The combined memory demand exceeded what macOS's memory compressor could handle.

Unlike Linux, which aggressively OOM-kills individual processes, macOS relies on a memory compressor with a hard segment limit. When the compressor hit 100% of its segment pool, it couldn't free memory for the kernel's watchdog timer thread. After 90 seconds without a check-in, the watchdog triggered a kernel panic.

**Why the fix works:**

1. **Removing `camelot-py[cv]`** eliminates the problematic compilation entirely. LlamaParse (cloud-based) is the primary PDF extractor and doesn't require native compilation.
2. **`MAKEFLAGS="-j1"`** forces single-threaded compilation, keeping peak memory within system limits.
3. **`--no-cache-dir`** reduces memory footprint by not caching intermediate build artifacts.
4. **`--only-binary :all:`** prevents compilation attempts entirely by requiring pre-built wheels.

## Prevention

### Before adding packages to requirements.txt
- Check if the package has pre-built wheels for your platform on [PyPI](https://pypi.org) (look for `.whl` files for macOS ARM64)
- Prefer `opencv-python-headless` over `opencv-python` (smaller, fewer system deps)
- Pin versions known to have wheel distributions: `package==X.Y.Z` not `package>=X.Y.Z`
- Add comments for packages requiring compilation: `# WARNING: compiles from source`

### Before running pip install
- Close memory-heavy applications (IDE, browser, Docker) if installing packages with native extensions
- Use the safe command: `MAKEFLAGS="-j1" pip install --no-cache-dir -r requirements.txt`

### For AI agents running pip installs
- Set `MAKEFLAGS="-j1"` before any pip install in automation
- Install packages sequentially, not all at once, when native compilation may be involved
- Catch install failures and retry with `--only-binary :all:`

### macOS-specific awareness
- macOS memory compressor has a hard segment limit (unlike Linux OOM-killer)
- Apple Silicon's high core count (14 on M3 Max) amplifies parallel compilation memory pressure
- Monitor with Activity Monitor or `vm_stat` during heavy compilation tasks

## Execution Context

This problem was first encountered during `/workflows:work` execution of the Dallas ISD PDF Parser plan.

- **Session:** `docs/execution-sessions/work-2026-02-19-192903/STATE.md`
- **Task:** Task 1.1 - Initialize Python Environment
- **What happened:** The workflow agent created a `.venv` and ran `pip install -r requirements.txt`. The `camelot-py[cv]` package triggered OpenCV compilation, which crashed the system before the task could complete.
- **Post-crash state:** `.venv` was partially created with incomplete dependencies. Required full removal (`rm -rf .venv`) and recreation.
- **Plan updated:** The plan file was updated to remove `camelot-py[cv]`, add pip safety notes, and document the risk for future reference.

## Related Issues

No related issues documented yet.
