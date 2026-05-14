# Tasks: CI Test Gate

- [x] Fix `backend/src/__tests__/routes/routes.test.js` — tests were written against a database mock but controllers were migrated to file-based content; rewrote to mock `contentLoader` instead
- [x] Add `coverageThreshold` (75% across all metrics) to `backend/jest.config.json`; exclude pre-existing untested controllers (romController, comicsController, berbatisController) and mocked/low-coverage utilities (contentLoader, auth, metrics)
- [x] Verify `yarn workspace charno-backend test:ci` passes (63 tests, 99.35% statements)
- [x] Add missing `romsAPI`, `berbatisAPI`, `comicsAPI` tests to `frontend/src/__tests__/services/api.test.js`
- [x] Add `mockPatch` to axios mock in api.test.js (was missing for `comicsAPI.update`)
- [x] Add Navigation branch test (archives active state)
- [x] Update `frontend/vitest.config.js` — switch from broad `exclude` to explicit `include` of 4 tested files; untested pages/components excluded until tests are written for them
- [x] Verify `yarn workspace frontend test:ci` passes (45 tests, 95.81% statements, 82.69% branches)
- [x] Add `test` job to `.github/workflows/build-backend.yml`
- [x] Add `needs: test` to the `build-and-push` job in `build-backend.yml`
- [x] Add `test` job to `.github/workflows/build-frontend.yml`
- [x] Add `needs: test` to the `build-and-push` job in `build-frontend.yml`
- [ ] Commit and push; confirm both workflows succeed on GitHub Actions
- [ ] Verify gate works: confirm a broken test on a branch blocks the Docker push

## Follow-up: untested code requiring its own specs

The following were excluded from coverage thresholds pending their own test suites:

**Backend:**
- `romController.js` (1337 lines) — ROM library CRUD
- `comicsController.js` — Comics archive CRUD (uses `JsonStore`)
- `comicsScrapeController.js` — Comic Vine scraper (excluded pending scraper tests)
- `berbatisController.js` — Berbatis site data
- `contentLoader.js` — Mocked in all tests; needs direct unit tests
- `auth.js` — Auth middleware
- `metrics.js` — Prometheus metrics middleware
- Routes for above: `berbatisRoutes`, `comicsRoutes`, `docsRoutes`, `romRoutes`
- `JsonStore.js` — JSON storage utility used by comicsController

**Frontend:**
- All pages except `About.jsx` (16 pages)
- All components except `Navigation.jsx` (LightboxHeader, PhotoInfoPanel, PhotoMap)
- `App.jsx`, `MainLayout.jsx`
- `mockApi.js`
- `api.js` lines 9 and 23–31 (VITE_USE_MOCK_API branch + paramsSerializer) — not coverable without env var manipulation in tests
