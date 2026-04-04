# Context: Scaffold Vite + React + TypeScript project

## Problem

No application code exists yet. A Vite + React + TypeScript scaffold is needed before any product work can begin.

### Problem Space

The repo currently has only docs and config (README, GOALS.md, TECH.md, CLAUDE.md, issue templates). There is no `src/`, no `package.json`, and no build system. Every subsequent issue — ESLint (#2), Vitest (#3), CI (#4), and all product work — depends on this scaffold existing first.

### Edge Cases

None — this is a greenfield setup with no existing code to migrate or preserve.

### Constraints

- Stack is fixed: TypeScript strict, React, Vite, pnpm (see TECH.md)
- `pnpm start` must alias the dev server (not `pnpm dev`)
- Must clean up all default Vite boilerplate before considering done

## Solution

### Approach

Use `pnpm create vite` with the official React + TypeScript template. It's the standard, minimal approach — no custom configuration needed at this stage. Clean up boilerplate after scaffolding.

### Architecture

Single-page app, browser-only. Vite handles dev server and production build. React is the UI layer. TypeScript runs through Vite's esbuild transform. The project root is the Terra repo itself — no monorepo, no subdirectories.

### Components

- `main.tsx` — mounts `<App />` into the DOM
- `App.tsx` — minimal placeholder: a `<main>` with a heading, no logic

### Dependencies

Only what `pnpm create vite` installs: `react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom`, `vite`, `@vitejs/plugin-react`. No additional packages.

### Data Flow

Static render only. `main.tsx` mounts `<App />` into the DOM. No state, no async.

### Error Handling

Not applicable — no async, no external calls, no user input.

### Testing

No tests for this issue. Vitest isn't set up yet (#3). Acceptance criteria are verified manually: `pnpm start` runs, `pnpm build` succeeds, boilerplate is gone.

## Open Questions

None.
