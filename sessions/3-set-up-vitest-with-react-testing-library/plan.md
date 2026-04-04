# Plan: Set up Vitest with React Testing Library

## Context

This issue installs and configures the test harness. There are no tests yet — `pnpm test` doesn't exist. The goal is a working Vitest + RTL setup proven by a single smoke test that renders `<App />`.

Key constraints:
- Test environment: `jsdom` (browser-like DOM)
- Vitest globals enabled — tests don't need to import `describe`, `it`, `expect`
- `@testing-library/jest-dom` matchers must be loaded via a setup file, not per-test
- `pnpm test` = watch mode; `pnpm test:run` = single run (for CI)

Files involved:
- `package.json` — new test scripts and devDependencies
- `vite.config.ts` — add `test` configuration block
- `tsconfig.app.json` — add `@testing-library/jest-dom` to `types`
- `src/test/setup.ts` — new file, imports jest-dom matchers globally
- `src/App.test.tsx` — new file, smoke test

## Tasks

### 1. Install test dependencies

```
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- `vitest` — Vite-native test runner
- `@testing-library/react` — renders React components in jsdom
- `@testing-library/jest-dom` — DOM matchers (`.toBeInTheDocument()`, etc.)
- `@testing-library/user-event` — user interaction simulation (needed for product tests)
- `jsdom` — browser-like DOM environment

Test cases: none — install only.

What to implement:
- All five packages in `package.json` devDependencies

Commit: `chore: install vitest and react testing library (#3)`

---

### 2. Configure Vitest in vite.config.ts

Add a `test` block to `vite.config.ts`:
- `environment: 'jsdom'`
- `globals: true`
- `setupFiles: ['src/test/setup.ts']`

Also add `/// <reference types="vitest" />` at the top of `vite.config.ts` so TypeScript recognises the `test` property on `defineConfig`.

Test cases: none — config only. Verified when smoke test runs.

What to implement:
- `vite.config.ts` has a valid `test` block

### 3. Create the test setup file

Create `src/test/setup.ts` with a single import:
```ts
import '@testing-library/jest-dom'
```

This runs before every test file and makes all jest-dom matchers available globally.

Add `@testing-library/jest-dom` to the `types` array in `tsconfig.app.json` so TypeScript recognises the matchers without explicit imports in test files.

Test cases: none — verified when smoke test passes.

What to implement:
- `src/test/setup.ts` exists with the jest-dom import
- `tsconfig.app.json` includes `@testing-library/jest-dom` in `types`

### 4. Add test scripts to package.json

Add to `package.json` scripts:
- `"test": "vitest"` — watch mode for development
- `"test:run": "vitest run"` — single run, used in CI

Test cases: none — script existence verified when smoke test runs.

What to implement:
- Both scripts present in `package.json`

### 5. Write the smoke test

Create `src/App.test.tsx`. It must:
1. Render `<App />` using RTL's `render`
2. Assert the heading "Terra" is visible in the document

Test cases:
- `<App />` renders without throwing
- The heading "Terra" is in the document (`getByRole('heading', { name: 'Terra' })`)

What to implement:
- `src/App.test.tsx` exists
- `pnpm test:run` exits 0 with 1 passing test

Commit: `chore: set up Vitest with React Testing Library (#3)`
