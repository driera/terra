# Plan: Show drawing metadata in the map footer

## Context

This issue introduces the footer bar — a full-width layout element at the bottom of the app that will serve as persistent chrome. It moves `Coordinates` out of its floating overlay and into the footer, and adds `DrawingMetadata` which shows the number of completed lines and total vertex count.

**Current layout (`src/App.tsx`):** a single `div.layout` fills the viewport (`100dvw × 100dvh`, `position: relative`). `MapCanvas`, `MapControls`, `DrawingToolbar`, and `Coordinates` are all children — the controls float absolutely over the map.

**Target layout:** `div.layout` becomes a flex-column. A map area div (`flex: 1`, `position: relative`) wraps `MapCanvas`, `MapControls`, and `DrawingToolbar`. A `Footer` component sits below as a full-width sibling. `MapCanvas` already uses `width: 100%; height: 100%` in its own CSS — no change needed there.

**`Coordinates` (`src/hud/Coordinates.tsx`):** self-contained component using `usePointer(['coordinates'])`. Currently styled with `position: absolute; bottom: 1rem; left: 1rem`. Moving it into the footer means removing that absolute positioning from `Coordinates.module.css`.

**`DrawingMetadata`:** new component. Uses `useDrawing(['geometries'])` (from `src/api/drawing.ts`). Derives line count (`geometries.length`) and total vertex count (sum of `feature.geometry.coordinates.length` across all features). Returns `null` when `geometries` is empty — no placeholder shown before the first line is completed.

**Store/hook pattern:** `useDrawing(keys)` is a `useSyncExternalStore`-based hook that re-renders only when the named keys change. Follow the same pattern as `usePointer` in `src/api/pointer.ts`.

**No new dependencies.**

## Tasks

### [x] 1. Restructure App layout into flex-column with map area and footer slot

The current flat layout needs a map area wrapper so floating controls stay scoped to the map, and a footer slot outside the map.

Test cases:
- `App` renders a map area and a footer as siblings
- Map area contains `MapCanvas`, `MapControls`, and `DrawingToolbar`
- Footer is rendered at the bottom of the layout

What to implement:
- Update `src/App.tsx`: wrap `MapCanvas`, `MapControls`, `DrawingToolbar` in a map area `div`; add `<Footer />` as a sibling below
- Update `src/App.module.css`: `.layout` becomes `display: flex; flex-direction: column; width: 100dvw; height: 100dvh`; add `.mapArea` with `flex: 1; position: relative; overflow: hidden`
- Create `src/hud/Footer.tsx`: renders `<DrawingMetadata />` and `<Coordinates />` as children, no logic
- Create `src/hud/Footer.module.css`: full-width, light background (`#ffffff`), border-top (`1px solid #d0d0d0`), fixed height (`2rem`), flex row, aligned center, padded horizontally

Commit: `feat(hud): introduce footer bar layout`

---

### [x] 2. Move Coordinates into the footer

`Coordinates` currently floats absolutely over the map. Moving it into the footer means stripping its absolute positioning so it flows naturally as a flex child.

Test cases:
- `Coordinates` renders its label when coordinates are present
- `Coordinates` renders nothing when coordinates are null
- (Existing tests should pass unchanged — only CSS changes)

What to implement:
- Update `src/hud/Coordinates.module.css`: remove `position: absolute`, `bottom`, `left`, `z-index`. Keep padding, background, border, border-radius, font styles — it will now appear as an inline pill inside the footer.

Commit: `refactor(hud): move Coordinates into footer bar`

---

### 3. Add DrawingMetadata component

New component that shows line count and vertex count, derived from completed geometries in the drawing store.

Types to define:
- No new types — uses `GeometryState` from `src/api/GeometryStore.ts`

Test cases:
- Returns `null` when `geometries` is empty
- Shows `1 line` when one geometry with any number of vertices is present
- Shows `2 lines` when two geometries are present (plural label)
- Shows correct total vertex count summed across all geometries
- Updates reactively when a new geometry is added

What to implement:
- Create `src/hud/DrawingMetadata.tsx`: call `useDrawing(['geometries'])`, return `null` when empty, derive `lineCount` and `vertexCount`, render as a text element
- Create `src/hud/DrawingMetadata.module.css`: minimal styles matching the footer pill pattern (same font-size and spacing as `Coordinates`)

Commit: `feat(hud): add DrawingMetadata component to footer`
