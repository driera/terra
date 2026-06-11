# Plan: Consolidate the api boundary: single command surface and enforced dependency rules

> **Status: all tasks done** (2026-06-11). Amendments agreed during implementation:
>
> 1. **Pure-domain ESLint block dropped** — per-file globs rot silently; purity stays a
>    reviewed convention (no domain file imports react/maplibre today anyway).
> 2. **UI regrouped under `src/features/` by capability** (`map/`, `drawing/`), replacing
>    widget-type folders `canvas/controls/hud` — makes the boundary rules folder-stable
>    and mirrors api modules. `ToolButton` → new `src/ui/` (design-system primitives);
>    `Logo` → `src/` root next to App (layout).
> 3. Boundary rules reduced to two folder-level blocks: features → api barrel only;
>    `api/`+`lib/` ↛ `features/`/`ui/`/`App`. Both fire-tested.
> 4. Commits deferred — Dani approves explicitly; proposed sequence at end of session.

## Context

`src/api/` is Terra's core: each module folder (`drawing/`, `pointer/`) is a lightweight bounded context holding pure domain logic, a `Store`, a map plugin (orchestrator), and a React hook. Features (`canvas/`, `controls/`, `hud/`) consume it only through the barrel `src/api/index.ts`; `App.tsx` composes. ADR 003 made `mapApi` the single facade for imperative commands.

The barrel currently violates its own contract: it exports drawing commands both on the `mapApi` facade **and** as named exports (`setDrawingMode`, `cancelDrawing`, `completeDrawing`), plus `getGeometry`/`getPointer`. **Verified: no file outside `src/api/` imports any of these named exports** — all call sites use `mapApi.*`. Named exports actually used by features: `useDrawing`, `usePointer`, `Modes`, `formatDistance`, and types (`Mode`, `DrawingState`, `PointerState`).

Other findings that ground this plan:

- `src/api/Store.ts` (reactive primitive, ADR 004) and `src/logger.ts` float without a home; consumers are `src/api/*/store.ts` and `src/location/useInitialCenter.ts`.
- `src/location/` is an api-style module (DI'd adapters + hook); only consumer is `src/canvas/MapCanvas.tsx` via deep import `'../location/useInitialCenter'`.
- ESLint uses flat config (`eslint.config.js`, typescript-eslint). No import-boundary rules exist. **No new packages needed** — per-glob `@typescript-eslint/no-restricted-imports` overrides cover all three boundary rules (it supports `allowTypeImports` where stores legitimately import maplibre types).

Conventions to follow: TDD (existing tests are the safety net for moves — they must pass unchanged in behavior, only import paths updated), pnpm, commit format `type(scope): message` tagged `(#25)`.

The rule being established: **commands in via `mapApi`, state out via hooks; features touch only the barrel; pure domain files know neither maplibre-gl nor react.**

## Tasks

### 1. Remove duplicated command exports from the top-level barrel

`src/api/index.ts` stops re-exporting `setDrawingMode`, `cancelDrawing`, `completeDrawing`, `getGeometry`, and `getPointer` as named exports. The `mapApi` facade keeps them. Module-level barrels (`api/drawing/index.ts`, `api/pointer/index.ts`) keep exporting them — they are internal wiring for the top-level barrel and api tests.

Test cases:
- Existing suites for `DrawingToolbar`, `HudStatus`, `Coordinates`, `MapCanvas`, `MapControls`, and `api/index.test.ts` pass — update any test mocking the removed named exports to mock the facade instead
- `api/index.test.ts`: assert the public surface — `mapApi` exposes the commands; verify named exports are limited to hooks, `Modes`, `formatDistance`, and types (if the existing test already enumerates exports, tighten it)

What to implement:
- Top-level barrel exports exactly: `mapApi` (default), `usePointer`, `useDrawing`, `Modes`, `formatDistance`, and the public types

Commit: `refactor(api): single command surface — drop duplicated named command exports (#25)`

---

### 2. Move shared primitives to `src/lib/`

`src/api/Store.ts` (+ its test) and `src/logger.ts` move to `src/lib/`. These are the shared kernel: used by api modules and `location`, owned by neither.

Test cases:
- `Store.test.ts` passes from its new location
- All consumers (`api/drawing/store.ts`, `api/pointer/store.ts`, `location/useInitialCenter.ts`) compile and their suites pass with updated imports

What to implement:
- `src/lib/Store.ts`, `src/lib/Store.test.ts`, `src/lib/logger.ts`; no file in `src/` imports `../api/Store` or `../logger` anymore

### 3. Move `location/` into `api/` and expose it through the barrel

`src/location/` moves to `src/api/location/`, keeping its internal structure. `useInitialCenter` is re-exported through `src/api/index.ts`. `MapCanvas` switches its deep import to the barrel.

Test cases:
- `location` suites (`useInitialCenter`, `getBrowserLocation`, `getIpLocation`) pass from the new path
- `MapCanvas` suite passes importing `useInitialCenter` from `'../api'`

What to implement:
- `src/api/location/` with an `index.ts` module barrel exporting `useInitialCenter` (and its types); top-level barrel re-exports it; no imports of `'../location/...'` remain outside `api/`

Commit: `refactor(api): move shared primitives to lib/ and location into api/ (#25)`

---

### 4. Enforce dependency direction with ESLint boundary rules

Add per-glob overrides to `eslint.config.js` using `@typescript-eslint/no-restricted-imports` (no new packages):

1. **Features → barrel only**: in `src/{canvas,controls,hud}/**`, imports matching api module internals (`**/api/*/...`) are errors; `'../api'` and `'../lib/...'` are allowed
2. **api → no features**: in `src/api/**`, imports from `canvas`, `controls`, `hud`, or `App` are errors
3. **Pure domain stays pure**: in `src/api/*/store.ts`, `src/api/*/distance.ts`, and `src/lib/**`, importing `react` or `maplibre-gl` is an error — except type-only imports of maplibre types where stores already rely on them (`allowTypeImports`)

Test cases (manual verification, documented in the PR/commit):
- `pnpm lint` passes on the clean codebase
- Temporarily adding each forbidden import (one per rule) makes `pnpm lint` fail with the boundary message — then revert

What to implement:
- `eslint.config.js` gains the three scoped rule blocks; zero violations in the current tree

Commit: `dx(lint): enforce api boundary and pure-domain import rules (#25)`

---

### 5. Document the boundary — ADR 010 and CLAUDE.md

Write `docs/ADRs/010-api-modules-as-lightweight-bounded-contexts.md`: api/ module folders are lightweight bounded contexts (pure domain + store + plugin + hook); commands flow in through the `mapApi` facade, state flows out through hooks; dependency direction is machine-enforced by ESLint. Alternatives considered: layered folders (`domain/application/infrastructure`) — rejected as ceremony at this size; abstracting MapLibre behind a port — rejected per ADR 001.

Update `CLAUDE.md`: folder convention gains `lib/`; `location` moves under the api list; map-architecture section states the commands-via-facade / reads-via-hooks rule.

Test cases:
- none (docs)

What to implement:
- ADR 010 following the existing template; CLAUDE.md sections updated and consistent with the final tree

Commit: `docs: add ADR 010 — api bounded contexts and dependency rules (#25)`
