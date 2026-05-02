# Plan: CI Test Gate

## Approach

Add a `test` job to each GitHub Actions workflow that runs before `build-and-push`. Use `needs: test` on the build job. Add `coverageThreshold` to the backend Jest config.

## Files changed

| File | Change |
|------|--------|
| `.github/workflows/build-backend.yml` | Add `test` job; add `needs: test` to `build-and-push` |
| `.github/workflows/build-frontend.yml` | Add `test` job; add `needs: test` to `build-and-push` |
| `backend/jest.config.json` | Add `coverageThreshold` at 75% for all metrics |

## Backend workflow test job

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'yarn'
    - run: yarn install --immutable
    - run: yarn workspace charno-backend test:ci
```

`test:ci` runs Jest with `--coverage --ci`. The `--ci` flag disables interactive mode and treats snapshot updates as failures.

## Frontend workflow test job

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'yarn'
    - run: yarn install --immutable
    - run: yarn workspace frontend test:ci
```

`test:ci` already exists in the frontend `package.json`.

## Backend coverage thresholds

Add to `backend/jest.config.json`:

```json
"coverageThreshold": {
  "global": {
    "branches": 75,
    "functions": 75,
    "lines": 75,
    "statements": 75
  }
}
```

## Trade-offs considered

- **Sequential vs parallel:** test and build-and-push run sequentially. Parallel would be faster but the build job must not start before tests pass — `needs` achieves that regardless. Sequential is simpler.
- **Yarn cache in CI:** `actions/setup-node` with `cache: 'yarn'` caches `node_modules`. The `--immutable` flag ensures the lockfile is respected and no new installs happen.
- **Test environment:** tests run on `ubuntu-latest` (x86). The Docker image is built for `linux/arm64`. This is acceptable — unit/integration tests don't need to match the deployment architecture.
