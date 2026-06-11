# CLAUDE.md

> Read this at the start of every session.

## Project

**Terra** — Draw geospatial shapes, explore them in 3D terrain, and share them — no account required.

`WORKFLOW_VERSION: forge@latest`

---

## Session start

1. Read this file
2. Check [GitHub Projects](https://github.com/users/driera/projects/2) for the current sprint
3. Pick the next issue, run `/explore-issue <NNN>`

---

## Workflow loop

```
explore-issue → plan → implement → review
```

Work artifacts per issue live in `sessions/NNN-issue-title/`:

- `context.md` — problem space, edge cases, architecture, components, data flow
- `plan.md` — ordered, testable tasks

---

## Commit convention

```
type: short imperative description
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `a11y`, `dx`

Examples:

```
feat: add drawing toolbar with polygon mode
a11y: implement keyboard navigation for map controls
docs: document terrain view approach
```

---

## MapTiler

Custom style forked from `outdoor-v2` with POI, trails, and native contour layers removed.

- **Style ID:** `019df8cf-b54b-74e9-81d2-7c1f124b88dd`
- **Bundled sources:** `contours`, `landform`, `maptiler_planet_v4`, `outdoor`, `terrain-rgb`
- **API key:** `VITE_MAPTILER_API_KEY` in `.env.local` (gitignored) — see `.env.example`

The `contours` source is already in the style — no `addSource` needed. Add layers directly via `map.once('load', ...)`.

---

## Map architecture

All map interactions go through `mapApi` (`src/api/`) — never call MapLibre methods directly. See ADR 003, ADR 005 and ADR 010.

- **Commands in via the facade, state out via hooks**: imperative calls use `mapApi.*` (e.g. `mapApi.setDrawingMode()`); reactive reads use the named hooks (`useDrawing`, `usePointer`, `useInitialCenter`). Commands are never imported as named exports.
- `mapApi.addLayer()` and `mapApi.flyTo()` are load-aware — callers never check `isStyleLoaded()`
- Map defaults live in `src/features/map/constants.ts` — update there, not inline
- Layer definitions live in `src/features/map/default-layers.ts` — add new layers there
- Reactive map state uses the `Store<T>` + `useX(keys)` hook pattern (e.g. `usePointer`). See ADR 004.

### Folder convention

Top-level folders under `src/` are categories (lowercase); files inside use PascalCase for components (e.g. `MapCanvas.tsx`) and camelCase for modules/hooks.

- `api/` — the core. One folder per bounded context (`drawing/`, `pointer/`, `location/`): pure domain logic + store + plugin + hook, exposed only through the barrel `src/api/index.ts`
- `features/` — presentation layer, one folder per capability mirroring api modules (`map/`, `drawing/`)
- `ui/` — design-system primitives shared across features (`ToolButton`)
- `lib/` — shared kernel (`Store`, `logger`); imports neither react nor maplibre
- `App.tsx` + `Logo.tsx` at `src/` root — composition and layout

Dependency direction is lint-enforced (ADR 010): features import only the api barrel; `api/` and `lib/` never import from `features/`, `ui/`, or `App`.

---

## Validation

```bash
pnpm lint         # eslint
pnpm check-types  # tsc --noEmit
pnpm test:run     # vitest run (CI mode)
```

---

## Principles

- **TDD** — tests before or alongside implementation, always
- **Documentation-first** — README and issues written before code
- **Short, intentional commits** — each commit tells a story
- **Clean code + functional patterns** — no shortcuts for speed
- **Dependency injection** — inject dependencies (e.g. logger, fetch) as parameters; don't import side-effectful globals directly. See `src/location/` for the established pattern.
