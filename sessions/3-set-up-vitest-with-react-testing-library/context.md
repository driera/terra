# Context: Set up Vitest with React Testing Library

## Problem

No test setup exists. Components can't be rendered and tested in isolation. `pnpm test` doesn't exist yet.

### Problem Space

Vitest is implied by the Vite stack but not installed or configured. React Testing Library (RTL) needs to be installed on top to render components in a browser-like environment. `@testing-library/jest-dom` provides DOM matchers globally. Once configured, a smoke test that renders `<App />` proves the full chain works. No product logic to test yet — this is purely infrastructure.

### Edge Cases

- `@testing-library/jest-dom` matchers must be imported in a setup file that runs before every test — not just in individual test files. Otherwise matchers like `.toBeInTheDocument()` won't be recognised.
- TypeScript must know about the jest-dom types — add to `tsconfig.app.json` types array.

### Constraints

- Test environment: jsdom (not happy-dom — more complete DOM implementation, fewer edge cases)
- Vitest globals mode enabled so tests don't need to import `describe`, `it`, `expect` manually
- `pnpm test` runs in watch mode; `pnpm test:run` runs once (used in CI)

## Solution

### Approach

Vitest with jsdom + RTL. Vitest runs inside Vite's pipeline — same transforms, same aliases, no separate babel config. Standard, well-documented, integrates cleanly with the existing Vite setup.

### Architecture

Vitest runs inside Vite's pipeline. Test environment is `jsdom`. A setup file (`src/test/setup.ts`) runs before each test file to import `@testing-library/jest-dom` matchers globally. Vitest picks up all `*.test.tsx` files.

### Components

- `vite.config.ts` — add `test` block: environment `jsdom`, `globals: true`, `setupFiles: ['src/test/setup.ts']`
- `src/test/setup.ts` — single import: `@testing-library/jest-dom`
- `src/App.test.tsx` — smoke test: renders `<App />`, asserts heading "Terra" is in the document
- `package.json` — add `"test": "vitest"` and `"test:run": "vitest run"` scripts
- `tsconfig.app.json` — add `@testing-library/jest-dom` to `types` array

### Dependencies

New devDependencies:

- `vitest` — test runner, Vite-native
- `@testing-library/react` — renders React components in jsdom
- `@testing-library/jest-dom` — custom DOM matchers (`.toBeInTheDocument()`, etc.)
- `@testing-library/user-event` — simulates user interactions (needed for later product tests)
- `jsdom` — DOM environment for Vitest

### Data Flow

No runtime data flow. Test files import components, RTL renders them into a jsdom document, assertions run against the DOM.

### Error Handling

Not applicable. If setup is wrong, `pnpm test` fails with a clear error.

### Testing

Smoke test: renders `<App />`, asserts `<h1>Terra</h1>` is visible. If it passes, the full chain (Vitest → jsdom → RTL → jest-dom) is confirmed working.

## Open Questions

None.
