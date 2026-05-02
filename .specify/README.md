# Spec-Driven Development — web-app

This directory follows the [Spec Kit](https://github.com/github/spec-kit) approach to spec-driven development.

## Inheritance

```
infra-k8s/.specify/memory/constitution.md   ← primary (GitOps, secrets, security, clean code)
        ↓
web-app/.specify/memory/constitution.md     ← this file (portfolio scope, monorepo, content, testing, CI/CD)
```

All infra-k8s principles apply here. Read that first if you are new to the project.

## Structure

```
.specify/
├── memory/
│   └── constitution.md   # Governing principles for this repo
└── specs/
    └── <###-feature>/    # One directory per feature/initiative
        ├── spec.md       # What to build (functional requirements, no implementation)
        ├── plan.md       # How to build it (technical design, file structure)
        └── tasks.md      # Ordered implementation steps
```

## How it works

**Constitution first.** `memory/constitution.md` contains the non-negotiable principles. Every spec and plan must be consistent with it.

**Spec → Plan → Tasks.** For any non-trivial change:
1. Write a `spec.md` — what problem, who it helps, acceptance criteria. No implementation details.
2. Write a `plan.md` — technical approach, affected files, trade-offs considered.
3. Write a `tasks.md` — concrete checklist, ordered, with parallel-safe tasks marked `[P]`.

**Small changes** (a content file edit, a translation string) don't need a full spec.

## Recommended first spec

Tests exist but are not enforced in CI — Docker images are built and pushed without running tests first. That is the most important pending work:

```
.specify/specs/001-ci-test-gate/
```
