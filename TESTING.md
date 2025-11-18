# Testing Documentation

This document describes the testing strategy, setup, and how to run tests for the Charno Web application.

## Overview

The application uses comprehensive unit testing with a minimum of 75% code coverage enforced by the CI/CD pipeline.

- **Backend**: Jest + Supertest
- **Frontend**: Vitest + Testing Library (React)
- **Coverage Threshold**: 75% (branches, functions, lines, statements)

## Backend Testing

### Framework

- **Jest**: Testing framework with ES modules support
- **Supertest**: HTTP assertion library for testing API routes
- **Mocking**: Database connections are mocked for unit tests

### Running Tests

```bash
cd backend

# Run tests once with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for CI (with coverage report)
npm run test:ci
```

### Test Structure

```
backend/src/__tests__/
├── controllers/          # Controller unit tests
│   ├── blogController.test.js
│   ├── contentController.test.js
│   ├── paperController.test.js
│   ├── photoController.test.js
│   └── projectController.test.js
└── routes/              # Route integration tests
    └── routes.test.js
```

### Coverage Configuration

Coverage thresholds are set in `jest.config.json`:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 75,
      "lines": 75,
      "statements": 75
    }
  }
}
```

### Writing Backend Tests

Example controller test:

```javascript
import { jest } from '@jest/globals';
import { getContent } from '../../controllers/contentController.js';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: { query: mockQuery }
}));

describe('Content Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return content for valid language and key', async () => {
    mockQuery.mockResolvedValue({ rows: [{ key: 'test', value: 'Test' }] });

    const req = { params: { language: 'en', key: 'test' } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await getContent(req, res);

    expect(res.json).toHaveBeenCalledWith({ key: 'test', value: 'Test' });
  });
});
```

## Frontend Testing

### Framework

- **Vitest**: Fast testing framework for Vite projects
- **Testing Library (React)**: Component testing utilities
- **jsdom**: Browser environment simulation
- **User Event**: User interaction simulation

### Running Tests

```bash
cd frontend

# Run tests once with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for CI (with coverage report)
npm run test:ci
```

### Test Structure

```
frontend/src/__tests__/
├── components/          # Component tests
│   └── Navigation.test.jsx
├── contexts/           # Context tests
│   └── LanguageContext.test.jsx
├── pages/              # Page component tests
│   └── About.test.jsx
└── services/           # Service/API tests
    └── api.test.js
```

### Coverage Configuration

Coverage thresholds are set in `vitest.config.js`:

```javascript
{
  coverage: {
    thresholds: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  }
}
```

### Writing Frontend Tests

Example component test:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<MyComponent onClick={mockOnClick} />);

    await user.click(screen.getByRole('button'));

    expect(mockOnClick).toHaveBeenCalled();
  });
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Pipeline Behavior

1. **Install Dependencies**: `npm ci` for both backend and frontend
2. **Run Linter**: Code quality checks (non-blocking)
3. **Run Tests**: Execute all tests with coverage
4. **Coverage Check**: **Pipeline fails if coverage < 75%**
5. **Upload Coverage**: Coverage reports uploaded as artifacts
6. **Build**: Only proceeds if tests pass
7. **Deploy**: Only proceeds if all steps pass

### Viewing Coverage

Coverage reports are uploaded as artifacts in GitHub Actions:
1. Go to the workflow run
2. Scroll to "Artifacts" section
3. Download `backend-coverage` or `frontend-coverage`
4. Open `index.html` in the coverage folder

## Test Coverage Goals

### Current Coverage

Run tests to see current coverage:

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Coverage Requirements

- ✅ **75% minimum** for all metrics (enforced by CI/CD)
- Controllers: High priority (>85% target)
- Routes: Complete coverage (>90% target)
- Services/API: Complete coverage (>90% target)
- Components: Focus on logic (>75% target)
- UI/Styling: Lower priority

### Excluded from Coverage

**Backend:**
- `src/server.js` - Entry point
- `src/config/database.js` - Database connection

**Frontend:**
- `src/main.jsx` - Entry point
- `src/i18n/` - Translation files
- `*.config.js` - Configuration files
- Test files themselves

## Best Practices

### Backend Tests

1. **Mock Database**: Always mock `pool.query()` to avoid real DB connections
2. **Test Error Cases**: Test both success and error scenarios
3. **Clear Mocks**: Use `beforeEach(() => jest.clearAllMocks())`
4. **Test Status Codes**: Verify correct HTTP status codes
5. **Test Response Shape**: Verify response structure matches API contract

### Frontend Tests

1. **Mock Dependencies**: Mock API calls, contexts, and external libraries
2. **Test User Interactions**: Use `userEvent` for realistic interactions
3. **Test Accessibility**: Use semantic queries (getByRole, getByLabelText)
4. **Test Loading States**: Test loading, error, and success states
5. **Avoid Implementation Details**: Test behavior, not implementation

### General

1. **Descriptive Names**: Use clear test descriptions
2. **Single Responsibility**: One concept per test
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **No Flaky Tests**: Tests should be deterministic
5. **Fast Tests**: Keep tests fast by mocking external dependencies

## Debugging Tests

### Backend

```bash
# Run specific test file
npm test -- contentController.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should return content"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend

```bash
# Run specific test file
npm test -- Navigation.test.jsx

# Run tests matching pattern
npm test -- --grep="should render"

# UI mode for interactive debugging
npm run test:watch
```

## Troubleshooting

### Common Issues

**Backend:**

1. **ES Modules Error**: Ensure `NODE_OPTIONS=--experimental-vm-modules` is set
2. **Mock Not Working**: Check mock is defined before importing module
3. **Async Issues**: Always use `async/await` or return promises

**Frontend:**

1. **Component Not Found**: Check mocks for react-i18next and react-router-dom
2. **Act Warning**: Wrap state updates in act() or use Testing Library's async methods
3. **CSS Import Error**: CSS files are handled by vitest config

### Getting Help

- Check test output for detailed error messages
- Review coverage reports to identify untested code
- Examine existing tests for patterns
- Consult Jest/Vitest documentation for advanced features

## Continuous Improvement

### Adding Tests

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all new code is covered
3. Run coverage report to verify
4. Update this documentation if needed

### Maintaining Coverage

- Monitor coverage trends in CI/CD
- Address coverage drops immediately
- Add tests for bug fixes
- Refactor tests as code evolves

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
