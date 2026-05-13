# 005. mapApi promoted to plugin-registry directory

**Date:** 2026-05-13
**Status:** Accepted

## Context

`mapApi` started as a single file (`src/Map/mapApi.ts`) — a singleton façade over the MapLibre instance (ADR 003). As new map domains (pointer, camera) need to attach their own event listeners at map registration time, the façade needs a way to wire multiple domain modules to the same lifecycle events (`register`, `destroy`) without `core.ts` importing each domain directly.

`mapApi` also lived inside `src/Map/`, conflating the façade with the map canvas component. As `MapCanvas` becomes a peer component alongside `MapControls` and `hud/`, `mapApi` belongs at the same level — it's infrastructure, not a component.

## Decision

`mapApi` becomes a directory (`src/mapApi/`) with the following structure:

- `core.ts` — map instance ref, `register`, `destroy`, `addLayer`, `flyTo`, `zoomIn`, `zoomOut`
- `Store.ts` — generic `StateManager` class (ADR 004)
- `pointer.ts` — pointer domain: state, `init`, `destroy`, `usePointer`
- `index.ts` — composition root: wraps `register`/`destroy` to call `_plugins.forEach(p => p.init/destroy(map))`, re-exports public API

`index.ts` is the only place that knows about all domain modules. `core.ts` is unaware of any domain.

## Alternatives Considered

**Keep `core.ts` as coordinator** — `core.ts` imports and calls each domain's `init`/`destroy` directly. Simple, but `core.ts` grows with every new domain and imports become tightly coupled.

**Internal event bus** — `core.ts` emits a `register` event; domains subscribe on import. Decoupled but introduces implicit side effects at module load time. Harder to test and reason about.

## Consequences

- Adding a new domain is a one-liner in `index.ts` (`_plugins`); `core.ts` never changes.
- Existing import paths (`../mapApi`) are preserved — `index.ts` re-exports everything.
- `MapCanvas` becomes a standalone component with no special relationship to `mapApi`.
- `App` becomes the layout orchestrator, rendering `MapCanvas`, `MapControls`, and HUD as siblings inside a `position: relative` container.
