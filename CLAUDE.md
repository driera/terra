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

All map interactions go through `mapApi` (`src/api/`) — never call MapLibre methods directly. See ADR 003 and ADR 005.

- `mapApi.addLayer()` and `mapApi.flyTo()` are load-aware — callers never check `isStyleLoaded()`
- Map defaults live in `src/canvas/constants.ts` — update there, not inline
- Layer definitions live in `src/canvas/default-layers.ts` — add new layers there
- UI controls live in `src/controls/`
- HUD overlays (coordinates, etc.) live in `src/hud/`
- Reactive map state uses the `Store<T>` + `useX(keys)` hook pattern from `src/api/` (e.g. `usePointer`). See ADR 004.

### Folder convention

Top-level folders under `src/` are categories (lowercase): `api`, `canvas`, `controls`, `hud`, `location`. Files inside use PascalCase for components (e.g. `MapCanvas.tsx`, `Coordinates.tsx`) and camelCase for modules/hooks.

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
