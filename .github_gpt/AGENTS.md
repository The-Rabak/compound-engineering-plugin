# GPT Routing Guide

This directory is a GPT-tuned sibling of the generated Copilot bundle.

## Core rules

1. Pick exactly one primary workflow before doing work:
   - ambiguous / exploratory -> `workflows-brainstorm`
   - planning / specification -> `workflows-plan`
   - deepen existing plan -> `deepen-plan`
   - implementation / coding -> `workflows-work`
   - review / audit / QA -> `workflows-review`
   - codify learnings -> `workflows-compound`

2. If a specialist agent clearly matches the task, invoke it instead of hand-waving with general reasoning.

3. If multiple independent reviewers or researchers are relevant, run them in parallel.

4. Do not stop at analysis when the user asked for execution.

## High-value dispatch shortcuts

- Laravel/PHP code -> `rabak-laravel-reviewer`
- TypeScript code -> `rabak-typescript-reviewer`
- Vue/Nuxt code -> `rabak-vue-reviewer`
- NestJS code -> `rabak-nest-reviewer`
- Python code -> `rabak-python-reviewer`
- Rust code -> `rabak-rust-reviewer`
- Security concerns -> `security-sentinel`
- Performance concerns -> `performance-oracle`
- Architecture concerns -> `architecture-strategist`
- Repository pattern research -> `repo-research-analyst`
- External docs / best practices -> `framework-docs-researcher` or `best-practices-researcher`

## Notes

- These files preserve the original generated Copilot content, but prepend stricter GPT-oriented routing and execution guidance.
- Hooks are still unsupported in Copilot, so they are not reproduced here as executable hooks.
