# 🧪 Testing Guide

## Overview

This project uses **Vitest** and **React Testing Library** for comprehensive testing. The test suite includes unit tests for individual components and integration tests for complex user flows.

## 📦 Test Infrastructure

### Technologies
- **Vitest** (v3.2.4) - Fast unit test framework
- **React Testing Library** (v16.3.0) - Component testing utilities
- **@testing-library/jest-dom** (v6.9.1) - Custom DOM matchers
- **@testing-library/user-event** (v14.6.1) - User interaction simulation
- **@vitest/coverage-v8** (v3.2.4) - Code coverage reporting
- **jsdom** (v27.0.0) - DOM implementation for Node.js

### Configuration
Test configuration is defined in `vite.config.js`:
- **Environment:** jsdom (simulates browser)
- **Globals:** Enabled for describe, test, expect, etc.
- **Setup:** `@testing-library/jest-dom` matchers loaded automatically

---

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests in watch mode (for development)
npm run test

# Run tests once (CI mode)
npm run test:ci

# Run tests with coverage report
npm run test:coverage

# Run tests with UI dashboard
npm run test:ui
```

### Watch Mode Features
- **Press `a`** - Run all tests
- **Press `f`** - Run only failed tests
- **Press `u`** - Update snapshots
- **Press `q`** - Quit watch mode

---

## 📊 Test Coverage

### Viewing Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in the `coverage/` directory:

```bash
# View HTML coverage report
open coverage/index.html           # macOS
start coverage/index.html          # Windows
xdg-open coverage/index.html       # Linux
```

### Coverage Metrics
The test suite tracks four coverage metrics:
- **Statements** - Individual code statements executed
- **Branches** - Conditional paths taken (if/else, switch)
- **Functions** - Functions called during tests
- **Lines** - Lines of code executed

---

## 🧩 Test Structure

### Unit Tests

Located in `src/components/__tests__/`, our unit tests verify individual component behavior:

#### BackToTop.test.jsx
Tests the scroll-to-top button component:
- ✅ Renders when scrolled down
- ✅ Hidden when at page top
- ✅ Scrolls to top when clicked
- ✅ Smooth scroll behavior

#### Cart.test.jsx
Tests shopping cart functionality:
- ✅ Displays cart items correctly
- ✅ Updates quantities
- ✅ Removes items
- ✅ Calculates totals accurately
- ✅ Shows empty state

#### Pagination.test.jsx
Tests pagination controls:
- ✅ Renders correct number of pages
- ✅ Navigates between pages
- ✅ Handles edge cases (first/last page)
- ✅ Disables buttons appropriately

#### ProductCard.test.jsx
Tests product display cards:
- ✅ Renders product information
- ✅ Shows pricing correctly
- ✅ Displays stock status
- ✅ Handles image loading/errors
- ✅ Add to cart interaction

#### ScrollToTop.test.jsx
Tests automatic scroll restoration:
- ✅ Scrolls to top on route change
- ✅ Preserves scroll state when needed
- ✅ Works with React Router

#### SearchBar.test.jsx
Tests search input component:
- ✅ Handles user input
- ✅ Triggers search on submit
- ✅ Debounces search queries
- ✅ Clears search input

### Integration Tests

#### CartIntegration.test.jsx
End-to-end test for cart functionality:
- ✅ Add product to cart from product page
- ✅ Cart state updates correctly
- ✅ Quantity adjustments work
- ✅ Cart persists across navigation
- ✅ Checkout flow integration

**This test satisfies the TDD requirement:** *"Conduct an integration test to ensure the Cart gets updated when adding a product"*

---

## ✍️ Writing Tests

### Test File Structure

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  test('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<YourComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### Best Practices

#### 1. Test User Behavior, Not Implementation
```javascript
// ✅ Good - Tests what users see
expect(screen.getByText('Add to Cart')).toBeInTheDocument();

// ❌ Bad - Tests implementation details
expect(component.state.isVisible).toBe(true);
```

#### 2. Use Accessible Queries
Priority order (from React Testing Library docs):
1. `getByRole` - Accessible to all users
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Input hints
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort only

```javascript
// ✅ Best
screen.getByRole('button', { name: /add to cart/i });

// ✅ Good for forms
screen.getByLabelText('Email Address');

// ⚠️ Use sparingly
screen.getByTestId('custom-button');
```

#### 3. Test Asynchronous Code Properly
```javascript
import { waitFor } from '@testing-library/react';

test('loads data', async () => {
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

---

## 🔄 CI/CD Testing Workflow

### GitHub Actions Integration

Tests run automatically on every push to `main` or `master` branch:

```yaml
# .github/workflows/main.yml
- name: Run tests
  run: npm run test:ci
  
- name: Generate coverage
  run: npm run test:coverage
```

### Build Protection
- ✅ All tests must pass before deployment
- ✅ Linting errors block deployment
- ✅ Build failures stop the pipeline
- ✅ Coverage reports sent to Codecov

### Local Pre-commit Checks

Before pushing code, run:
```bash
npm run lint           # Check code quality
npm run test:ci        # Run all tests
npm run build          # Verify build works
```

---

## 📈 Test-Driven Development (TDD)

This project follows TDD principles:

### Red-Green-Refactor Cycle

1. **🔴 Red** - Write a failing test
2. **🟢 Green** - Write minimal code to pass
3. **🔵 Refactor** - Improve code while tests pass

### Benefits
- ✅ Prevents regressions
- ✅ Documents expected behavior
- ✅ Encourages modular design
- ✅ Catches bugs early
- ✅ Enables confident refactoring

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
