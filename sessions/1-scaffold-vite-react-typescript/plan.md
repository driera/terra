# Plan: Scaffold Vite + React + TypeScript project

## Context

This issue creates the application foundation — the first code in the repo. There is no `src/`, no `package.json`, and no build system yet. Every subsequent issue (ESLint, Vitest, CI, all product work) depends on this existing.

Files involved after this issue:
- `package.json` — scripts and dependencies
- `vite.config.ts` — Vite configuration with React plugin
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` — TypeScript strict config
- `src/main.tsx` — mounts `<App />` into the DOM
- `src/App.tsx` — minimal placeholder, no logic
- `index.html` — Vite entry point

Constraints:
- Package manager: pnpm
- `pnpm start` must start the dev server (not `pnpm dev`)
- TypeScript strict mode must be enabled
- All default Vite boilerplate (counter, logos, CSS demo) must be removed
- No tests for this issue — Vitest is set up in #3

## Tasks

### 1. Scaffold the project with pnpm create vite

Run `pnpm create vite` in the Terra repo root using the `react-ts` template. This installs all base dependencies and generates the initial project structure.

After scaffolding, install dependencies:
```
pnpm install
```

Verify `pnpm build` runs without errors before moving on.

Test cases: none — verified manually.

What to implement:
- `package.json` exists with react, react-dom, typescript, vite, @vitejs/plugin-react, @types/react, @types/react-dom
- `pnpm build` exits with code 0

### 2. Configure pnpm start and verify TypeScript strict

Update `package.json` scripts so that `pnpm start` starts the dev server (rename or alias `dev` → `start`).

Verify `tsconfig.json` (or `tsconfig.app.json`) has `"strict": true`. If not present, add it.

What to implement:
- `pnpm start` starts the dev server without errors
- TypeScript strict mode is active

Commit: `chore: scaffold Vite + React + TypeScript project (#1)`

---

### 3. Clean up boilerplate

Remove all default Vite placeholder content:
- Delete `src/assets/` (Vite and React logos)
- Delete `src/App.css` and `src/index.css` (or clear them if referenced)
- Replace `src/App.tsx` with a minimal placeholder — a `<main>` element with a single heading (e.g. "Terra")
- Update `src/main.tsx` to remove any CSS imports that no longer exist
- Update `index.html` title to "Terra"

What to implement:
- `pnpm start` renders a clean page with a heading — no logos, no counter, no demo styles
- `pnpm build` still exits with code 0
- No TypeScript errors

Commit: `chore: clean up Vite boilerplate (#1)`
