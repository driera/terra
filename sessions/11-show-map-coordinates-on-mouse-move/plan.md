# Plan: Show map coordinates on mouse move

## Context

Add a coordinate HUD at the bottom of the map showing `lat, lng` under the cursor. The work also lands two structural changes documented in ADR 004 (Store + hook pattern) and ADR 005 (mapApi as plugin-registry directory).

**Files involved:**
- `src/Map/mapApi.ts` → becomes `src/mapApi/{index,core,Store,pointer}.ts`
- `src/Map/` → renamed to `src/MapCanvas/`, the component file becomes `MapCanvas.tsx`
- `src/App.tsx` — becomes layout orchestrator, renders MapCanvas + MapControls + Coordinates as siblings inside a `position: relative` wrapper
- `src/hud/Coordinates.tsx` + CSS + test — new HUD component
- `src/map-controls/MapControls.tsx` — imports updated to `../mapApi`
- Test files alongside each module

**Patterns to follow:**
- TDD — tests before implementation, always (CLAUDE.md)
- pnpm only — `pnpm test:run`, `pnpm lint`, `pnpm check-types`
- CSS modules co-located with components
- Vitest + React Testing Library; mock `mapApi` via `vi.mock('../mapApi')`
- a11y check with `jest-axe` in component tests
- ADR 003 still applies: components never call MapLibre directly, only through `mapApi`

**Non-obvious:**
- `mapApi` is a singleton — `register(map)` is called from `MapCanvas`'s `useEffect`, `destroy()` from cleanup. Plugin `init`/`destroy` ride on these lifecycle calls.
- `usePointer` uses `useSyncExternalStore` — `subscribe` and `getSnapshot` must have stable references (use `useMemo` keyed by the joined `keys` array).
- `StateManager.set` should compute `changedKeys` by comparing previous vs incoming values using `Object.is`, and skip notification when no key actually changed.
- The existing zoom buttons in `MapControls` import from `../Map/mapApi`. After the move, that path becomes `../mapApi`.

## Tasks

### 1. Promote mapApi to directory and rename Map → MapCanvas [x]

Structural-only refactor. Behavior unchanged. All existing tests still pass after import path updates.

What to implement:
- Create `src/mapApi/` with `index.ts` and `core.ts`. Move all current `mapApi.ts` contents into `core.ts`. `index.ts` re-exports everything from `core.ts` (no plugin registry yet).
- Delete `src/Map/mapApi.ts`.
- Rename `src/Map/` → `src/MapCanvas/`; rename `Map.tsx`/`Map.test.tsx`/`Map.module.css` → `MapCanvas.tsx`/`MapCanvas.test.tsx`/`MapCanvas.module.css`. Update component name and CSS class names.
- Update all imports across the codebase (`MapControls`, `App`, tests).
- Run `pnpm lint`, `pnpm check-types`, `pnpm test:run` — all green.

Commit: `refactor: promote mapApi to directory and rename Map to MapCanvas (#11)`

---

### 2. Make App the layout orchestrator [x]

App owns the positioning context. `MapCanvas` no longer renders `MapControls` as a child.

Test cases (`App.test.tsx`):
- Renders `MapCanvas`
- Renders `MapControls`
- Wrapper element has `position: relative` (or uses the layout CSS module class)

What to implement:
- Move `<MapControls />` out of `MapCanvas.tsx` into `App.tsx`.
- Remove `position: relative` from `MapCanvas.module.css`; add a layout wrapper class in `App.module.css` (or equivalent) that grants positioning context.
- `MapCanvas.test.tsx` — drop assertions about `MapControls` being a child.
- `pnpm test:run`, `pnpm lint`, `pnpm check-types` — all green.

Commit: `refactor: move layout orchestration to App (#11)`

---

### 3. Add generic `Store` (StateManager) class [x]

Reactive state primitive — generic, no map knowledge. Lives at `src/mapApi/Store.ts`.

Types to define:
- `Subscriber<T> = (data: T, changedKeys: (keyof T)[]) => void`
- `class Store<T>` with constructor `(resetData: () => T)`

Test cases (`Store.test.ts`):
- `get()` returns initial state from `resetData()` factory
- `set(partial)` updates state and notifies subscribers with the data and `changedKeys`
- `set` with values equal to current state (via `Object.is`) produces empty `changedKeys` — subscribers still called once (or never, see implementation choice below) — pick one and document
- `subscribe(cb)` returns an unsubscribe function that removes the callback
- `subscribeOnce(cb)` fires on the next `set` and never again
- `reset()` restores state from the factory and clears all subscribers

What to implement:
- The class as described in ADR 004 — indexed subscriber map (`{ [k: number]: Subscriber }` + `nextIndex`), `subscribersOnce` array, `set` computes `changedKeys` and notifies, `reset` re-runs the factory.

Commit: `feat: add Store reactive state primitive (#11)`

---

### 4. Add `pointer` domain module [x]

Map-aware state for cursor position. Lives at `src/mapApi/pointer.ts`. Holds a `Store<PointerState>` instance, wires MapLibre `mousemove`/`mouseleave`.

Types to define:
- `PointerState = { coordinates: [number, number] | null }`
- `PointerAttribute = keyof PointerState`

Test cases (`pointer.test.ts`):
- `init(mockMap)` registers `mousemove` and `mouseleave` listeners on the map
- Firing a synthetic `mousemove` with `lngLat: { lng, lat }` updates store coordinates to `[lng, lat]`
- Firing `mouseleave` clears coordinates to `null`
- `destroy()` removes both listeners and resets the store
- `getPointer()` returns the current store snapshot

What to implement:
- Module-level `Store<PointerState>` with factory `() => ({ coordinates: null })`
- `init(map)` — store `_map` ref, attach two listeners that call `store.set(...)`
- `destroy()` — guard on `_map`, detach listeners, null `_map`, call `store.reset()`
- `getPointer()` exported for non-React consumers (smoke test only — no production caller yet)

Commit: `feat: add pointer domain module (#11)`

---

### 5. Add `usePointer` hook [x]

React binding for the pointer store using `useSyncExternalStore` with a `changedKeys` filter.

Test cases (`pointer.test.ts` — same file, new describe block, uses `@testing-library/react` `renderHook`):
- `usePointer(["coordinates"])` returns current pointer state from the store
- After `store.set({ coordinates: [1, 2] })`, the hook returns the new state
- A component subscribed to `["coordinates"]` does not rerender when an unrelated key changes (use a probe state with two keys to verify; add a temporary test-only key if needed, or document why this is verified once camera/other state exists)
- Unsubscribes on unmount (no callback left in subscribers)

What to implement:
- `usePointer(keys: PointerAttribute[])` — uses `useSyncExternalStore`. `subscribe` is `useMemo`d over `keys.join(',')`: returns a wrapped subscriber that filters on `changedKeys`. `getSnapshot` returns `store.get()`.
- Stable references for `subscribe` and `getSnapshot` are mandatory — otherwise `useSyncExternalStore` resubscribes on every render.

Commit: `feat: add usePointer hook (#11)`

---

### 6. Wire `pointer` into mapApi plugin registry

`index.ts` becomes the composition root.

Test cases (`index.test.ts`):
- Calling `register(map)` triggers `pointer.init` with the same map instance
- Calling `destroy()` triggers `pointer.destroy`
- `register` still delegates to `core.register` (existing behavior preserved)
- `destroy` still delegates to `core.destroy`

What to implement:
- `index.ts`:
  - Import `* as core from './core'` and `* as pointer from './pointer'`
  - Define `_plugins = [pointer]`
  - Export `register` and `destroy` that call core's version plus each plugin's `init`/`destroy`
  - Re-export `addLayer`, `flyTo`, `zoomIn`, `zoomOut` from core
  - Re-export `usePointer`, `getPointer` from pointer

Commit: `feat: wire pointer plugin into mapApi (#11)`

---

### 7. Add `Coordinates` HUD component

Dumb component in `src/hud/`. Consumes `usePointer(["coordinates"])`.

Test cases (`Coordinates.test.tsx`, with `vi.mock('../mapApi')`):
- Renders nothing (empty / null result) when `usePointer` returns `{ coordinates: null }`
- Renders formatted `41.3851, 2.1734` when `usePointer` returns `{ coordinates: [2.1734, 41.3851] }` (note: array is `[lng, lat]`, display order is `lat, lng`)
- Coordinates are rounded to 4 decimal places
- a11y: passes `jest-axe` with zero violations

What to implement:
- `Coordinates.tsx` — call hook, format `coordinates[1]` (lat) and `coordinates[0]` (lng) to 4 decimal places, render in a `<div>` with appropriate role/aria-live for screen reader updates
- `Coordinates.module.css` — `position: absolute; bottom: 1rem; left: 1rem`; legible styling consistent with `MapControls`

Commit: `feat: add Coordinates HUD component (#11)`

---

### 8. Render `Coordinates` in App

Final integration.

Test cases (`App.test.tsx`):
- Renders `Coordinates` alongside `MapCanvas` and `MapControls`

What to implement:
- Import `Coordinates` in `App.tsx`, render it as a sibling inside the layout wrapper
- Verify all quality gates: `pnpm lint`, `pnpm check-types`, `pnpm test:run`

Commit: `feat: integrate Coordinates HUD into App (#11)`
