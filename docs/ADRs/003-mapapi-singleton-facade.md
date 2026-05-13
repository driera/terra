# 003. mapApi singleton façade for MapLibre instance lifecycle

**Date:** 2026-05-13
**Status:** Accepted

## Context

`Map.tsx` was directly constructing and destroying the MapLibre `Map` instance, assigning `window.map` for debug access, and calling instance methods inline. As the application grows to include zoom controls, drawing tools, and terrain interactions, every new consumer would need direct access to the same instance — creating pressure to either pass it via props, thread it through React context, or reach for `window.map` as an informal global.

MapLibre's `Map` is inherently a page singleton: there is one instance per page, it owns its own camera state, and it has no meaningful parallel. The lifecycle question is not _which_ instance to use but _when_ it is ready.

## Decision

Introduce `mapApi` — a module-level singleton façade in `src/Map/mapApi.ts`. It owns the MapLibre instance lifecycle (`register`, `destroy`) and exposes a typed surface for all map interactions (`addLayer`, `flyTo`, `zoomIn`, `zoomOut`). `Map.tsx` calls `mapApi.register(map)` after construction and `mapApi.destroy()` on cleanup. All other consumers import `mapApi` directly — no instance passing required.

Load-aware methods (`addLayer`, `flyTo`) defer internally via `map.once('load', ...)` when the style is not yet ready. Callers never check `isStyleLoaded()`.

## Alternatives Considered

**React context / custom hook** — pass the map instance down via `MapContext` or return it from a `useMap()` hook. Rejected because MapLibre is not a React concern: it manages its own lifecycle outside the render cycle, and coupling it to React's provider tree adds complexity with no benefit. It also makes the instance unavailable to non-component modules (future drawing engine, export utilities, etc.).

**`window.map` as informal global** — keep direct `window.map` access as the sharing mechanism. Rejected because it is untyped, untestable, and implicit. `mapApi` retains `window.map` assignment for debug convenience, but it is not the intended access path.

## Consequences

- All map interactions now have a single, stable import (`mapApi`) — no prop drilling, no context provider
- `Map.tsx` becomes a thin mount/unmount wrapper with no direct MapLibre calls
- Control components (`MapControls`, future drawing tools) depend only on `mapApi`, not on React component hierarchy
- The façade is a natural place to add future camera helpers (`rotateBy(delta)`, `tiltBy(delta)`) that encapsulate read-modify patterns, keeping consumers simple
- Module-level singleton means one map instance per page — consistent with MapLibre's own model, but worth noting if multi-map support is ever needed

## References

- Issue #9: Add custom map controls (zoom)
- `src/Map/mapApi.ts`
