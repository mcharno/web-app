# web-app Constitution

> This constitution **extends** the [infra-k8s primary constitution](https://github.com/mcharno/infra-k8s/blob/main/.specify/memory/constitution.md). All principles defined there — GitOps, sealed secrets, network policies, resource constraints, security defaults, clean code, documentation, and changelog — apply here in full. This document adds what is specific to this repo.

## I. This Is a Personal Portfolio with a Defined Scope

web-app is charno.net — a personal website showcasing academic work, projects, publications, photography, and a blog. It is not a general-purpose platform or CMS.

- New features must serve the core use case: present the owner's work to the public.
- Do not add multi-user features, data submission forms, or editorial workflows. If scope genuinely needs to expand, write a spec first.
- The site is multilingual (English/Greek via react-i18next). New user-facing text must include both languages. Do not add English-only strings without a corresponding Greek translation key, even if the translation value is a placeholder.

## II. Monorepo Boundaries Are Respected

Yarn 4 workspace with `frontend` and `backend` packages. They are separate deployable units with separate Dockerfiles, `package.json` files, and test configs.

- `frontend/` and `backend/` are built, tested, and deployed independently.
- Root `package.json` scripts orchestrate across workspaces. Package-specific scripts run via `yarn workspace <name> <script>`.
- `yarn.lock` changes are always committed.
- Do not import backend modules from frontend or vice versa. The contract between them is the HTTP API.

## III. Content Is File-Based — Keep It That Way

The backend serves content from `backend/content/` — JSON and Markdown files organised by language (`en/`, `gr/`). This is intentional: it avoids a database dependency for read-only editorial content.

- Do not introduce a database for content that can live in files.
- PostgreSQL is available but reserved for dynamic data that genuinely requires it (e.g. user-generated, transactional).
- New content types follow the existing pattern: a JSON or Markdown file per language, loaded via `contentLoader`.
- Content files are source-controlled. Changes to content go through Git, not a CMS interface.

## IV. Tests Must Gate Deploys

Tests gate both CI workflows. No Docker image is built or pushed unless the test job passes.

- Backend (Jest): 75% coverage threshold configured in `backend/jest.config.json`. Several large controllers (rom, comics, berbatis) are explicitly excluded pending their own specs.
- Frontend (Vitest): 75% threshold configured in `frontend/vitest.config.js` against an explicit include list of tested files. New files must be added to this list only when their tests are written.
- `continue-on-error` must never appear on test steps.
- Every new route (backend) and every new page/component (frontend) must have a test covering at minimum the happy path and a missing-parameter error case.

## V. CI/CD Is GitOps-Wired

The GitHub Actions workflows build arm64 Docker images, push to GHCR, and commit updated image tags back to `infra-k8s` manifests. This is the only deployment path.

- Do not manually update image tags in `infra-k8s`. The CI workflow owns that.
- Workflow steps that commit back to `main` use `git pull --rebase` before push to handle concurrent workflow runs. Keep this pattern.
- Each workflow is path-scoped (`backend/**` or `frontend/**`). Do not widen path triggers unnecessarily.
- Image tags use the short SHA (`sha256-<short>`). Do not change this scheme without updating `infra-k8s` image policy.
