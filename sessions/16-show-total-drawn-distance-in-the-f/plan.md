# Plan: Show total drawn distance in the footer

## Context

The footer bar has three slots: Coordinates (pointer position), DrawingMetadata (line count, vertex count), and a status indicator. This issue adds live distance to the middle slot so users get spatial feedback while planning routes.

Distance updates on every mousemove — it reflects the sum of all completed lines plus the current draft segment up to the cursor. When the cursor leaves the map the draft falls back to the placed vertices. When nothing has been drawn, the block renders nothing.

**New module structure for `src/api/`:**

Each plugin becomes a folder with a barrel `index.ts`. The main plugin file shares its folder's name. Store and hook each get their own file. Pure utility functions get their own file within the module.

```
src/api/
  core/
    core.ts           ← plugin logic (register, destroy, addLayer, flyTo, zoomIn, zoomOut)
    core.test.ts
    index.ts
  drawing/
    drawing.ts        ← plugin logic (init, destroy, setMode, complete, cancel)
    drawing.test.ts
    store.ts          ← GeometryStore class (renamed from GeometryStore.ts)
    store.test.ts
    distance.ts       ← pure functions: getCompletedDistance, getDraftDistance, formatDistance
    distance.test.ts
    useDrawing.ts     ← single public hook
    useDrawing.test.ts
    index.ts
  pointer/
    pointer.ts        ← plugin logic (init, destroy, getPointer)
    pointer.test.ts
    store.ts          ← PointerState type + Store instance
    usePointer.ts     ← usePointer hook
    usePointer.test.ts
    index.ts
  Store.ts            ← generic Store<T> utility, shared across modules
  Store.test.ts
  index.ts            ← top-level aggregator, public API unchanged
```

**Key design decisions:**

- `useDrawing(keys: GeometryAttribute[])` keeps the selective subscription pattern — the consumer declares which store keys should trigger a re-render. It returns derived `DrawingState` (not raw `GeometryState`). `useMemo` on `geometries` handles the distance performance concern.
- `DrawingMetadata` subscribes to `['geometries', 'vertices', 'cursor']` to get live distance on every mousemove.
- `DrawingToolbar` subscribes to `['vertices']` — only needs `isDrawing`, does not re-render on cursor moves.
- `vertices` is internal. `DrawingToolbar` replaces `vertices.length > 0` with `isDrawing`.

**Files directly involved:**

- `src/api/drawing/distance.ts` — pure calculation functions (new)
- `src/api/drawing/useDrawing.ts` — single hook returning derived metadata (new)
- `src/api/index.ts` — updated import paths, public exports unchanged
- `src/hud/DrawingMetadata.tsx` — updated to consume new `useDrawing`, add distance
- `src/hud/DrawingMetadata.test.tsx` — updated test cases
- `src/controls/DrawingToolbar.tsx` — `vertices.length > 0` → `isDrawing`
- `src/controls/DrawingToolbar.test.tsx` — updated if needed

**Patterns to follow:**

- Components are purely presentational: no store access, no turf imports
- CSS muted state: `styles.muted` from `DrawingMetadata.module.css`
- `@turf/length` returns km by default — pass `{ units: 'meters' }`

---

## Tasks

### 1. Install @turf/length

```
pnpm add @turf/length
```

Commit: `chore(deps): add @turf/length for geodesic distance calculation`

---

### 2. Restructure src/api/ into per-module folders

Move all files into the folder structure described in the Context section. No logic changes — only moves, renames, and import path updates. The public surface of `src/api/index.ts` must not change.

What to verify after the move:
- `pnpm lint`, `pnpm check-types`, `pnpm test:run` all pass
- No file outside `src/api/` needs to change any import path

Commit: `refactor(api): split api/ into per-module folders with barrel files`

---

### 3. Pure distance calculation functions

Create `src/api/drawing/distance.ts` with three exported pure functions. No React, no store access.

Test cases for `getCompletedDistance(geometries)`:
- Empty array → 0
- Single LineString from [0,0] to [1,0] → approximately 111,000 m (1 degree longitude at equator ≈ 111 km)
- Two geometries → sum of both lengths

Test cases for `getDraftDistance(vertices, cursor)`:
- Empty vertices, no cursor → 0
- Single vertex, no cursor → 0
- Single vertex + cursor → distance between those two points
- Two vertices, no cursor → distance between them
- Two vertices + cursor → distance across all three points

Test cases for `formatDistance(metres)`:
- 0 → `"0 m"`
- 340.7 → `"341 m"`
- 1500 → `"1500 m"`

What to implement:
- `getCompletedDistance` — sums `@turf/length` with `{ units: 'meters' }` over all features
- `getDraftDistance` — builds `[...vertices, cursor]` (if cursor present), returns 0 if fewer than 2 points, otherwise `@turf/length` in metres
- `formatDistance` — returns `"${Math.round(metres)} m"`

Commit: `feat(drawing): pure distance calculation functions`

---

### 4. useDrawing hook

Create `src/api/drawing/useDrawing.ts`. This is the single public hook for the drawing module. It subscribes directly to the full store via `useSyncExternalStore` (no key filtering), memoises completed distance on `geometries`, and returns derived metadata.

Types to define:
- `DrawingState`:
  ```
  { isDrawing: boolean, hasCompleted: boolean, lineCount: number, vertexCount: number, distance: number }
  ```

Test cases (render a wrapper component, call `useDrawing` with the relevant keys each time):
- Called with `['geometries', 'vertices', 'cursor']`, no store data → `isDrawing: false`, `hasCompleted: false`, `distance: 0`
- Called with `['geometries', 'vertices', 'cursor']`, vertices + cursor → `isDrawing: true`, distance includes cursor as endpoint
- Called with `['geometries', 'vertices', 'cursor']`, completed geometry → `hasCompleted: true`, `lineCount` and `vertexCount` correct
- Called with `['vertices']`, cursor changes in store → component does NOT re-render (subscribe selectivity works)
- Cursor-only store update does not recompute `getCompletedDistance` — spy on it to confirm

What to implement:
- Selective subscription: re-render only when one of the given keys changes in the store
- `completedDistance` memoised with `useMemo` keyed on `geometries`
- `distance = completedDistance + getDraftDistance(vertices, cursor)`
- Returns `DrawingState` regardless of which keys were passed

Export `DrawingState` and `useDrawing` from the drawing barrel and from `src/api/index.ts`.

Commit: `feat(drawing): useDrawing hook with derived metadata and live distance`

---

### 5. Update DrawingMetadata and DrawingToolbar

Update both components to consume the new `useDrawing()` and remove all uses of the old hook signature.

Test cases for `DrawingMetadata`:
- No drawing activity → renders nothing
- Drawing, no completed geometries → renders only formatted distance (e.g. `"340 m"`), not muted
- Completed geometries, not drawing → renders lines+vertices span and distance span, neither muted
- Completed geometries, drawing → lines+vertices span has muted class; distance span does not
- A11y: axe passes with zero violations

What to implement in `DrawingMetadata`:
- Replace `useDrawing(['geometries', 'vertices'])` with `useDrawing()`
- Remove `drawing…` span
- When `!hasCompleted && !isDrawing` → return null
- When `hasCompleted` → render a span `{lineCount} {line/lines} · {vertexCount} vertices`, muted when `isDrawing`
- When `distance > 0` or `isDrawing` → render a separate distance span with `formatDistance(distance)`, never muted
- `aria-live="polite"` and `aria-atomic="true"` on the distance span

What to implement in `DrawingToolbar`:
- Change `useDrawing(['vertices'])` — signature stays, return type changes from `GeometryState` to `DrawingState`
- Replace `vertices.length > 0` with `isDrawing`

Commit: `feat(hud): show live distance in drawing metadata footer`
