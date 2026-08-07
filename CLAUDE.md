# Agent Context: web-app

## What This Is

**charno.net** — a personal website and portfolio. Showcases academic work, projects, publications, photography, and a blog. Multilingual (English/Greek via react-i18next). Not a CMS or multi-user platform.

## Repository Layout

```
web-app/
├── backend/              # Express API, file-based content system
│   ├── content/          # Source-controlled content (JSON/Markdown)
│   │   ├── en/           # English content
│   │   └── gr/           # Greek content
│   ├── src/
│   │   ├── controllers/  # Route handlers (some large: romController 1337 lines)
│   │   ├── routes/       # Express routers
│   │   ├── middleware/   # auth, metrics, errorHandler
│   │   └── utils/        # contentLoader, JsonStore
│   ├── jest.config.json  # 75% coverage threshold; several controllers excluded
│   └── Dockerfile
├── frontend/             # React 18 + Vite
│   ├── src/
│   │   ├── pages/        # 17 pages (only About.jsx has tests)
│   │   ├── components/   # Navigation (tested), LightboxHeader, PhotoInfoPanel, PhotoMap
│   │   ├── services/     # api.js (axios), mockApi.js
│   │   └── i18n/         # EN/GR translation keys
│   ├── vitest.config.js  # 75% threshold; explicit include list (only tested files)
│   └── Dockerfile
├── infra/k8s/base/       # Kubernetes manifests (image tags managed by CI)
├── .github/workflows/    # build-backend.yml, build-frontend.yml
└── .specify/             # Spec-driven development (constitution + specs)
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node 20, Express 4, file-based content (JSON/Markdown) |
| Frontend | React 18, Vite, react-i18next, React Router v6, Axios |
| Testing | Backend: Jest 29 + Supertest. Frontend: Vitest + Testing Library |
| Deploy | arm64 Docker → GHCR → infra-k8s (ArgoCD) |

## Key URLs

| Environment | URL |
|-------------|-----|
| External | charno.net, www.charno.net |
| Cluster backend | ClusterIP :3000 |
| Cluster frontend | ClusterIP :80 (nginx) |

## How to Run

```bash
yarn dev                                    # starts both (backend :3000, frontend :5173)
yarn workspace charno-backend test:ci       # backend tests with coverage
yarn workspace frontend test:ci             # frontend tests with coverage
yarn workspace frontend build               # production build
```

## Deployment Flow

Push to `main` → GitHub Actions builds arm64 Docker images → pushes to GHCR → commits updated image tags to `infra/k8s/base/` → ArgoCD picks up the tag change in the infra-k8s repo → cluster deploys.

**Never update image tags in `infra/k8s/base/` manually.** The CI workflow owns that.

## Current State

| Area | Status |
|------|--------|
| CI test gate | Live — `build-and-push` requires `test` to pass |
| Backend coverage | 75% threshold enforced; several controllers explicitly excluded (rom, comics, berbatis) |
| Frontend coverage | 75% threshold enforced on explicit include list (About, Navigation, services) |
| Untested backend | romController (1337 lines), comicsController, comicsScrapeController, berbatisController, auth, metrics |
| Untested frontend | 16 pages, 3 components (LightboxHeader, PhotoInfoPanel, PhotoMap), App.jsx, MainLayout.jsx |

## Governing Principles

See `.specify/memory/constitution.md` in this repo (extends [infra-k8s primary constitution](https://github.com/mcharno/infra-k8s/blob/main/.specify/memory/constitution.md)).

Key rules specific to this repo:
- All user-facing text needs both EN and GR keys — no English-only strings
- Content lives in `backend/content/` as files, not in a database
- PostgreSQL is available but reserved for genuinely dynamic/transactional data

## Active Specs

| Spec | Status |
|------|--------|
| [001-ci-test-gate](.specify/specs/001-ci-test-gate/) | Complete — CI gate live, untested controllers documented for follow-on specs |

## Common Issues

| Issue | Fix |
|-------|-----|
| `yarn workspace frontend test:ci` fails coverage | Check `vitest.config.js` include list — only add files that have tests |
| Image tag not updating in infra-k8s | CI workflow commits to `infra/k8s/base/` — check GitHub Actions run |
| Greek translations missing | Add key to both `en/` and `gr/` content files |
