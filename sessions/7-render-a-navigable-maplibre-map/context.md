# Context: Render a navigable MapLibre map

## Problem

Get a real interactive map on screen for the first time, replacing the `<h1>Terra</h1>` placeholder. Uses MapLibre GL JS with OpenFreeMap tiles (no API key required). Foundation for all future drawing, 3D terrain, and MapTiler work.

### Problem Space

`App.tsx` currently renders a heading. This issue wires up MapLibre GL JS for the first time — installs the library, renders a full-viewport map with a free tile source, and verifies that pan, drag, scroll-zoom, keyboard navigation, and attribution all work out of the box.

### Edge Cases

- OpenFreeMap style URL fails to load (network offline, CDN down) — MapLibre fires an `error` event; map renders empty. No special handling required for this issue.
- MapLibre cannot render in jsdom — requires mocking in tests.

### Constraints

- No API key for this issue — OpenFreeMap only.
- MapLibre requires its CSS (`maplibre-gl/dist/maplibre-gl.css`) to render correctly.
- Vite base path is `/terra/` — tile and worker URLs must work under this subpath (MapLibre handles this automatically).

## Solution

### Approach

Direct MapLibre GL JS integration — no React wrapper library (no react-map-gl, no maplibre-react-components). A thin `<Map />` component owns the MapLibre instance via `useRef` + `useEffect`. Keeps the stack lean and avoids abstraction that would constrain future drawing and 3D terrain work.

### Architecture

`App` renders `<Map />` which fills the viewport. `Map` owns the MapLibre instance — created once on mount, destroyed on unmount. No global state or context. The map instance lives in a `ref` to avoid triggering re-renders.

### Components

- `src/components/Map/Map.tsx` — mounts a `<div>` ref, initialises `maplibregl.Map` in `useEffect` with the OpenFreeMap liberty style, default center, and default zoom. Imports `maplibre-gl/dist/maplibre-gl.css`. Styled to fill the viewport.
- `src/components/Map/Map.test.tsx` — unit tests for the component.
- `src/App.tsx` — replaces `<h1>Terra</h1>` with `<Map />`.

### Dependencies

- `maplibre-gl` — map engine. Provides `Map`, `AttributionControl`, WebGL rendering, built-in pan/drag/zoom/keyboard navigation.

### Data Flow

Initialisation only. MapLibre fetches tiles directly from OpenFreeMap in the browser. The `Map` component holds the instance in a `ref` (not state) so React re-renders do not recreate it.

### Error Handling

No special error handling for this issue. If the OpenFreeMap style fails to load, MapLibre fires an `error` event internally and renders an empty map. Graceful degradation is deferred.

### Testing

MapLibre requires WebGL and cannot render in jsdom. Strategy:
- Mock `maplibre-gl` in tests
- Assert the container `<div>` renders
- Verify `maplibregl.Map` was called with expected options (style URL, container, center, zoom)
- A11y: run `axe` against the rendered output and assert zero violations

## Open Questions

- None.
