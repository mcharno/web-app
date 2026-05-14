# Spec: CI Test Gate

## Problem

The GitHub Actions CI workflows (`build-backend.yml`, `build-frontend.yml`) build and push Docker images without running tests first. A broken change can be deployed to production without any test failure being surfaced. The coverage thresholds configured in `vitest.config.js` (frontend) are never checked in CI; the backend has no thresholds at all.

## Who it helps

- Prevents regressions reaching the cluster silently.
- Makes test failures visible at the point of change, not after.
- Completes the constitution requirement: "No Docker image may be built or pushed unless tests pass first."

## Scope

- Add a test + coverage job to `build-backend.yml` that runs before the Docker build.
- Add a test + coverage job to `build-frontend.yml` that runs before the Docker build.
- Add coverage thresholds to the backend Jest config (75% across all metrics, matching frontend).
- The build-and-push job must declare `needs: test` so it cannot run if tests fail.

## Out of scope

- Writing new tests — this spec enforces what already exists.
- Changing coverage thresholds on the frontend (already at 75%).
- Parallelising test and build jobs (fine to do sequentially for now).

## Acceptance criteria

1. Pushing a change to `backend/**` triggers a test job; the build-and-push job does not start unless the test job passes.
2. Pushing a change to `frontend/**` triggers a test job; the build-and-push job does not start unless the test job passes.
3. Backend Jest is configured with `coverageThreshold` at 75% for branches, functions, lines, and statements.
4. A test that is intentionally broken locally fails the CI run and blocks the Docker push (manually verified once).
5. No `continue-on-error` on any test step.
