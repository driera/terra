# Context: Show total drawn distance in the footer

## Problem

Users have no spatial feedback while drawing lines — they can see shape but not length. Adding distance to the footer gives them a running total that helps with route planning and outdoor measurement.

### Problem Space

The footer already shows coordinates (pointer position) and drawing metadata (line count, vertex count). Distance is a natural third field in the metadata block. The feature depends on the footer infrastructure introduced in #13.

### Edge Cases

- Drawing the first line (no completed geometries yet): show only the live draft distance, no line/vertex counts
- Cursor leaves the map mid-draw: draft distance falls back to vertices only (no cursor endpoint)
- Single vertex placed, no second point yet: draft distance is 0, distance shows 0 m
- No drawing activity at all: metadata block renders nothing

### Constraints

- Distance in metres only (no km threshold for now)
- Must pass axe with zero a11y violations
- All map interactions go through the `mapApi` — no direct MapLibre calls from components

## Solution

### Approach

Live distance including the cursor position (Option B). On every mousemove the distance updates to reflect completed geometries plus the current draft segment up to the cursor. This is more useful than a `…` placeholder because the user sees the total growing in real time as they plan a route.

### Architecture

A single hook `useDrawingMetadata` lives in `src/api/` alongside `drawing.ts`. It owns the full subscription to drawing state (including cursor) and exposes a derived object that `DrawingMetadata` consumes directly. The component is purely presentational — no store access, no turf imports.

Pure calculation functions (`calcCompletedDistance`, `calcDraftDistance`, `formatDistance`) live in the same module, enabling isolated unit tests without React.

### Components

**`src/api/drawingMetadata.ts`** — new module:
- `calcCompletedDistance(geometries)` → sums `@turf/length` over all completed LineString features, returns metres
- `calcDraftDistance(vertices, cursor)` → length of the current draft segment (vertices + cursor if present), returns metres; returns 0 if fewer than 2 points
- `formatDistance(metres)` → `"340 m"` — always metres, rounded to nearest integer
- `useDrawingMetadata()` → subscribes to `['geometries', 'vertices', 'cursor']`; memoises `completedDistance` on `geometries`; adds `calcDraftDistance` on every cursor update; returns `{ lineCount, vertexCount, distance, isDrawing, hasCompleted }`

**`src/hud/DrawingMetadata.tsx`** — updated:
- Replaces dual hook calls with single `useDrawingMetadata()`
- Removes `drawing…` span — status slot is a separate concern (notification HUD, future issue)
- Layout: metadata block shows `{lineCount} lines · {vertexCount} vertices · {distance}` when `hasCompleted`; shows only `{distance}` when `!hasCompleted && isDrawing`; entire block gets `muted` class when `isDrawing`

**Footer layout (three slots):**
```
[ Coordinates ]  [ lines · vertices · distance ]  [ drawing… / — ]
```
The middle slot is `DrawingMetadata`. The rightmost slot (status) already exists and is unchanged by this issue.

### Dependencies

`@turf/length` — geodesic line length from a GeoJSON Feature or Geometry. Standard in the geospatial JS ecosystem, tree-shakeable, no transitive deps worth noting.

### Data Flow

```
mousemove → store.setCursor()
          → GeometryStore notifies cursor subscribers
          → useDrawingMetadata re-renders
               ├─ completedDistance  (memoised, unchanged)
               └─ draftDistance      (recalculated: vertices + cursor)
          → DrawingMetadata re-renders with new distance

complete() → store.addGeometry() + store.clearDraft()
           → GeometryStore notifies geometries + vertices subscribers
           → useDrawingMetadata re-renders
               ├─ completedDistance  (recomputed — geometries changed)
               └─ draftDistance      (0 — draft cleared)
           → DrawingMetadata re-renders: distance unmutes, line/vertex counts update
```

### Error Handling

Coordinates in the store are always valid — the plugin only writes coords from MapLibre mouse events. `@turf/length` on a LineString with fewer than 2 points returns 0; this is handled by the `>= 2` guard in `calcDraftDistance`.

### Testing

- `calcCompletedDistance`, `calcDraftDistance`, `formatDistance`: pure unit tests with real geographic coordinates to verify metre values are plausible
- `useDrawingMetadata`: test via a wrapper component, mocking `useDrawing` — verify memoisation behaviour (completedDistance does not recompute on cursor-only changes)
- `DrawingMetadata`: update existing tests (remove `drawing…` assertions), add cases for distance rendering, verify muted class applies to the whole block including distance

## Open Questions

None — all design decisions closed.
