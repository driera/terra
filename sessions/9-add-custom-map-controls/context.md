# Context: Add custom map controls (zoom)

## Problem

Users can only zoom via pinch or scroll gestures. There are no on-screen zoom buttons, and the map has no abstraction layer over the MapLibre instance — every interaction touches it directly.

### Problem Space

- No zoom buttons — users must pinch or scroll
- `Map.tsx` directly calls MapLibre methods, assigns `window.map`, and manages cleanup — no single owner of the instance lifecycle

---

## Solution

Introduce `mapApi` — a module-level singleton façade that owns the MapLibre instance. Migrate `Map.tsx` to route through it. Add two zoom buttons as the first real consumer of the facade.

### Architecture

- **`src/Map/mapApi.ts`** — module-level singleton. Wraps the MapLibre `Map` instance. All map interactions route through this module.

  Public API:
  - `register(map)` — stores the instance, assigns `window.map` for debug
  - `destroy()` — calls `map.remove()`, deletes `window.map`, nulls the ref
  - `addLayer(layer)` — load-aware: defers via `map.once('load', ...)` if style not yet loaded
  - `flyTo(options)` — load-aware: same deferral pattern
  - `zoomIn()`, `zoomOut()` — delegate directly to the MapLibre instance
  - All methods are no-ops if called before `register` or after `destroy`

- **`src/map-controls/MapControls.tsx`** — two buttons (zoom in, zoom out) positioned absolute over the map. Each calls the corresponding `mapApi` method.

### mapApi lifecycle and Map.tsx

- `Map.tsx` calls `mapApi.register(map)` immediately after `new maplibregl.Map(...)`
- `Map.tsx` cleanup becomes `mapApi.destroy()` only — no direct `map.remove()` or `window.map` assignment
- `Map.tsx` uses `mapApi.addLayer(...)` for both contour layers and `mapApi.flyTo(...)` for initial center

### Data flow

```
new maplibregl.Map(...) → mapApi.register(map)
useInitialCenter() resolves → mapApi.flyTo({ center, zoom })
button click → mapApi.zoomIn() / mapApi.zoomOut()
unmount → mapApi.destroy()
```

### Component placement

`MapControls` is a child of the map container div in `Map.tsx`. CSS `position: absolute` places it over the map canvas.

### Constants

- `DEFAULT_CENTER` and `DEFAULT_ZOOM` extracted to `src/Map/constants.ts` — shared between `Map.tsx` and any future consumers
- `RESOLVED_ZOOM` stays private to `Map.tsx`

### MapLibre camera API notes (for future iterations)

MapLibre manages all camera state internally — no viewState needs to be stored in mapApi.

- **Zoom** — `map.zoomIn()` / `map.zoomOut()` are built-in and handle relative increments natively.
- **Bearing (rotation)** — no built-in `rotateBy`. Pattern: `map.rotateTo(map.getBearing() + delta)`. mapApi should expose `rotateBy(delta)` to encapsulate the read-modify, keeping `getBearing()` internal.
- **Pitch (tilt)** — same pattern: `map.setPitch(map.getPitch() + delta)`. mapApi should expose `tiltBy(delta)`.

This means future control components always pass a delta (`+22.5`, `-15`) — they never need to read camera state directly.

### Edge cases

- mapApi methods called before `register` or after `destroy` are silent no-ops
- `addLayer` and `flyTo` defer to `map.once('load', ...)` if style not yet loaded — callers never check `isStyleLoaded()`
