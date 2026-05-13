# Plan: Add custom map controls (zoom)

## Context

Terra's map has no abstraction over the MapLibre instance — `Map.tsx` calls it directly, assigns `window.map`, and manages cleanup inline. This issue introduces `mapApi`, a module-level singleton façade that owns the instance lifecycle and exposes a typed surface for all map interactions. Zoom buttons are added as the first consumer.

**Files directly involved:**
- `src/Map/Map.tsx` — initializes the map; migrated to use mapApi
- `src/Map/Map.test.tsx` — updated to mock mapApi instead of maplibregl internals

**New files:**
- `src/Map/mapApi.ts` — singleton façade (co-located with Map.tsx)
- `src/Map/mapApi.test.ts` — unit tests for all mapApi methods
- `src/Map/constants.ts` — `DEFAULT_CENTER` and `DEFAULT_ZOOM` extracted here
- `src/map-controls/MapControls.tsx` + `.module.css` + `.test.tsx`

**Patterns to follow:**
- CSS modules for component styles
- Vitest + React Testing Library for component tests; `jest-axe` for a11y
- `useEffect` for map lifecycle with cleanup

**Non-obvious domain notes:**
- MapLibre's `isStyleLoaded()` returns false until the style JSON and tiles are ready. `addLayer` and `flyTo` must defer if called before load fires — this is encapsulated in mapApi, callers never check it directly.

---

## Tasks

### 1. `mapApi.ts` — lifecycle and load-aware operations

Introduce the mapApi module with its full public surface. This is the foundation Map.tsx migration and MapControls both depend on.

Test cases:
- `register(map)` stores the instance and assigns `window.map`
- `destroy()` calls `map.remove()`, deletes `window.map`, nulls the internal ref
- `addLayer(layer)` calls `map.addLayer(layer)` immediately when style is loaded
- `addLayer(layer)` registers a `map.once('load', ...)` handler when style is not loaded
- `flyTo(options)` calls `map.flyTo(options)` immediately when style is loaded
- `flyTo(options)` registers a `map.once('load', ...)` handler when style is not loaded
- `zoomIn()` delegates to `map.zoomIn()`
- `zoomOut()` delegates to `map.zoomOut()`
- All methods are no-ops when called before `register` or after `destroy`

What to implement:
- `src/Map/mapApi.ts` with `register`, `destroy`, `addLayer`, `flyTo`, `zoomIn`, `zoomOut`

### 2. Migrate `Map.tsx` to use mapApi

Replace all direct MapLibre instance calls in `Map.tsx` with mapApi equivalents. Behavior is unchanged — pure refactor. Extract `DEFAULT_CENTER` and `DEFAULT_ZOOM` to `constants.ts` along the way.

Test cases (update existing tests):
- `mapApi.register` is called with the map instance after construction
- `mapApi.addLayer` is called twice (contour-line, contour-label)
- `mapApi.flyTo` is called when `center` resolves
- `mapApi.destroy` is called on unmount
- `window.map` is no longer directly assigned or deleted in `Map.tsx`

What to implement:
- `Map.tsx` calls `mapApi.register(map)` after `new maplibregl.Map(...)`
- `Map.tsx` uses `mapApi.addLayer(...)` for both contour layers
- `Map.tsx` uses `mapApi.flyTo(...)` in the center effect
- `Map.tsx` cleanup becomes `mapApi.destroy()` only
- `Map.test.tsx` mocks `mapApi` module; keeps maplibregl mock for instantiation only

Commit: `feat: introduce mapApi singleton facade (#9)`

---

### 3. `MapControls` — zoom buttons

Add zoom in and zoom out buttons over the map. These are the first real consumers of mapApi.

Test cases:
- Zoom in button calls `mapApi.zoomIn()`
- Zoom out button calls `mapApi.zoomOut()`
- Both buttons are keyboard accessible
- Axe reports zero violations

What to implement:
- `src/map-controls/MapControls.tsx` with two buttons
- `src/map-controls/MapControls.module.css` for positioning and layout
- `<MapControls />` rendered inside the map container in `Map.tsx`

Commit: `feat: add zoom controls (#9)`
