# Context: Show drawing metadata in the map footer

## Problem

As a user, I want to see how many geometries and vertices I've drawn in a footer bar so I have spatial context while working.

### Problem Space

No footer bar exists yet. `Coordinates` and `DrawingToolbar` are independent absolutely-positioned overlays floating over the map. Issue #13 introduces the footer as a real layout element — a full-width bar at the bottom of the layout, outside the map area — and moves `Coordinates` into it alongside the new `DrawingMetadata` component.

One geometry = one completed line (first click → double-click or Enter). Completed geometries are stored as `GeoJSON.Feature<LineString>` in `GeometryStore.geometries[]`, fully observable via `useDrawing(['geometries'])`.

### Edge Cases

- Footer is always visible, even before any drawing — it serves as persistent chrome.
- `DrawingMetadata` returns `null` when `geometries` is empty (no zeros, no placeholders).
- `Coordinates` already handles `null` coordinates (no mouse movement yet).
- Distance is deferred — no distance field, no in-progress indicator.

### Constraints

- No new dependencies.
- Distance calculation deferred to a follow-up issue.
- Floating controls (`MapControls`, `DrawingToolbar`) remain absolutely positioned inside the map area — untouched.
- Light theme styling consistent with existing `Coordinates` HUD.

## Solution

### Approach

Restructure `App` into a flex-column layout with a real footer DOM sibling rather than a floating overlay. Each footer child is self-contained via its own store hook — no prop drilling through the footer shell.

### Architecture

`App` becomes `flex-direction: column`. Map area takes `flex: 1` with `position: relative` (retains floating controls). `MapCanvas` switches from `100dvh/100dvw` to `100%`. Footer is a full-width row at the bottom with fixed height, rendering `<DrawingMetadata />` and `<Coordinates />` as children.

### Components

- `src/hud/Footer.tsx` + `Footer.module.css` — layout shell, full-width, light background, fixed height. No data logic.
- `src/hud/DrawingMetadata.tsx` — calls `useDrawing(['geometries'])`, derives line count and total vertex count, returns `null` when empty.
- `src/hud/Coordinates.tsx` — moved from floating overlay into the footer. Absolute positioning removed from CSS.
- `src/App.tsx` + `App.module.css` — layout restructure to flex-column.
- `src/canvas/MapCanvas.tsx` — switch to `100%` sizing.

### Dependencies

None.

### Data Flow

`GeometryStore` → `useDrawing(['geometries'])` → `DrawingMetadata` derives counts and renders.
`PointerStore` → `usePointer(['coordinates'])` → `Coordinates` renders.
`Footer` is a passive layout shell — owns no state, passes no props.

### Error handling

`DrawingMetadata` returns `null` when `geometries` is empty. `Coordinates` already handles `null` coordinates. No other failure modes.

### Testing

- `DrawingMetadata`: unit tests for count/vertex derivation from mock geometries; `null` render when `geometries` is empty.
- `Footer`: renders both children; no logic to test beyond structure.
- `App` layout change: no unit test — covered by running the app.

## Open Questions

- Distance calculation deferred — will need a follow-up issue to add total linear distance to the footer.
