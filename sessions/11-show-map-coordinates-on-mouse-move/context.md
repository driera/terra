# Context: Show map coordinates on mouse move

## Problem

Users exploring Terra have no spatial reference beyond map tiles — no way to know their exact position without external tools. A coordinate HUD at the bottom of the map provides immediate positional feedback as the cursor moves.

### Problem Space

MapLibre's `mousemove` event exposes `lngLat` on every cursor move. The challenge is wiring that event into React state efficiently — avoiding unnecessary rerenders in unrelated components — and doing so through `mapApi` rather than directly against the MapLibre instance.

This issue also drives two structural changes: `mapApi` becomes a plugin-registry directory (ADR 005), and a new `Store<T>` / `useX(keys)` pattern is established for reactive map state (ADR 004).

### Edge Cases

- Coordinates display clears when cursor leaves the map (`mouseleave`)
- Component mounts before map is registered — `init` is called from `mapApi.register`, so no race condition
- `destroy()` must detach listeners and reset store to avoid stale state after unmount

### Constraints

- All map interactions go through `mapApi` — no direct MapLibre calls from components
- Component lives in `src/hud/`, not `src/map-controls/`
- Coordinates formatted as decimal degrees: `41.3851, 2.1734` (4 decimal places, lng/lat order display as lat/lng)

## Solution

### Approach

Standalone `Coordinates` component in `src/hud/` consuming a `usePointer(["coordinates"])` hook. The hook binds to a `pointer` domain module inside `src/mapApi/` — a `Store<PointerState>` instance wired to MapLibre events via the plugin registry. Component stays dumb; all state logic lives in the domain module.

### Architecture

`mapApi` refactored from a single file to a directory:

```
src/mapApi/
  index.ts       — composition root, plugin registry (_plugins = [pointer])
  core.ts        — map instance ref, register, destroy, addLayer, flyTo, zoomIn, zoomOut
  Store.ts       — generic StateManager<T> class (ADR 004)
  pointer.ts     — PointerState, init, destroy, usePointer
src/hud/
  Coordinates.tsx
  Coordinates.module.css
  Coordinates.test.tsx
src/MapCanvas/   — renamed from src/Map/
  MapCanvas.tsx
  ...
```

`App` becomes the layout orchestrator — renders `MapCanvas`, `MapControls`, and `Coordinates` as siblings inside a `position: relative` container.

### Components

- **`Store.ts`** — generic `StateManager<T>`: typed state, indexed subscriber map, `set(partial)` with `changedKeys`, `subscribe(cb)`, `subscribeOnce(cb)`, `reset()`. Takes `resetData: () => T` factory.
- **`pointer.ts`** — `Store<PointerState>` instance (`{ coordinates: [number, number] | null }`). `init(map)` attaches `mousemove`/`mouseleave`. `destroy()` detaches and resets. `usePointer(keys)` — `useSyncExternalStore` with `changedKeys` guard.
- **`index.ts`** — wraps `register`/`destroy` from `core.ts` to call `_plugins.forEach(p => p.init/destroy(map))`. Re-exports full public API.
- **`Coordinates.tsx`** — calls `usePointer(["coordinates"])`, formats as `41.3851, 2.1734`, renders nothing when null. Positioned `bottom: 1rem; left: 1rem` absolute within the map layout container.
- **`App.tsx`** — adds `position: relative` layout wrapper, renders `MapCanvas`, `MapControls`, `Coordinates` as siblings.

### Dependencies

None new.

### Data Flow

MapLibre `mousemove` → `pointer.init` handler → `store.set({ coordinates })` → subscribers notified with `changedKeys` → `usePointer` guard checks `["coordinates"] ∩ changedKeys` → `setState` → `Coordinates` rerenders with formatted value.

On `mouseleave` → `store.set({ coordinates: null })` → same path → component renders nothing.

### Error Handling

- `mapApi.register/destroy` are the only entry points for plugin lifecycle — no-ops if called out of order are handled in `core.ts` as before.
- `pointer.destroy()` guards against double-detach with a `_map` null check.
- `usePointer` subscribes on mount, unsubscribes on unmount via `useSyncExternalStore` cleanup.

### Testing

- **`Store.ts`** — unit: `set` notifies subscribers with correct `changedKeys`; skips notification when value unchanged; `reset` clears state and subscribers; `subscribeOnce` fires once only.
- **`pointer.ts`** — unit: `init` attaches listeners; `mousemove` sets coordinates; `mouseleave` clears; `destroy` detaches and resets; `usePointer(["coordinates"])` does not rerender when non-subscribed keys change.
- **`Coordinates.tsx`** — renders formatted coords; renders nothing when null; a11y axe check.
- **`MapCanvas.tsx`** — existing tests updated for rename; `mapApi.register` still called.
- **`App.tsx`** — updated to assert `Coordinates` is rendered.

## Open Questions

None.
