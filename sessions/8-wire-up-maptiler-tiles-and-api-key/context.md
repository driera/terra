# Context: Wire up MapTiler tiles and API key

## Problem

Swap OpenFreeMap tiles for MapTiler's `outdoor-v2` style and add elevation isolines as an explicit, controllable layer. Introduce API key management so the key is never committed.

### Problem Space

`Map.tsx` currently hardcodes an OpenFreeMap style URL with no layer management. This issue replaces it with MapTiler's `outdoor-v2` style (outdoor/terrain aesthetic) and wires up elevation isolines from MapTiler's `contours-v2` tile source as explicit layers — giving full control over styling and toggling.

`outdoor-v2` includes native contour layers. We hide those on load and replace them with our own layers backed by `contours-v2`, so contour rendering is fully in the codebase rather than split between the MapTiler style editor and our code.

The API key must be available locally via `.env.local` (gitignored), documented in `.env.example` for contributors, and injected into CI/CD via a GitHub secret.

### Edge Cases

- Missing or invalid API key — MapLibre fires an internal `error` event and renders an empty map. No special handling for this issue.
- `map.on('load')` fires asynchronously — source and layer setup must happen inside the callback.

### Constraints

- `VITE_MAPTILER_API_KEY` must never be committed — Vite inlines it at build time, so it must be set in the build environment.
- MapTiler attribution is required — handled by MapLibre's default `AttributionControl`.
- Native contour layer IDs in `outdoor-v2` are not hardcoded in MapTiler's public docs — discoverable by inspecting the style JSON at runtime with a real key. Must be identified during implementation.

## Solution

### Approach

Use `outdoor-v2` as the base style for its outdoor/terrain aesthetic. On `map.on('load')`, hide its native contour layers and add an explicit `contours-v2` vector source with our own line and label layers. This keeps all contour logic in the codebase — versioned, visible, fully controllable — without forking the style in MapTiler Cloud.

### Architecture

`Map.tsx` gains a `map.on('load')` handler alongside the existing `useRef` + `useEffect` lifecycle. No new components. All layer setup is co-located with the map initialisation.

### Components

- `src/Map/Map.tsx` — replaces `STYLE_URL` with the `outdoor-v2` URL, adds `map.on('load')` to: (1) hide native contour layers via `setLayoutProperty`, (2) add `contours-v2` source, (3) add contour line and label layers
- `.env.local` — holds the real API key locally (gitignored via `*.local`)
- `.env.example` — documents `VITE_MAPTILER_API_KEY=` for contributors
- `.env.test` — sets `VITE_MAPTILER_API_KEY=test-key` for Vitest
- `.github/workflows/ci.yml` — adds `VITE_MAPTILER_API_KEY: ${{ secrets.VITE_MAPTILER_API_KEY }}` to the build and deploy steps

### Dependencies

None. `import.meta.env` is Vite built-in. MapLibre's `addSource`/`addLayer`/`setLayoutProperty` are part of the already-installed `maplibre-gl`.

### Data Flow

`VITE_MAPTILER_API_KEY` (env) → inlined by Vite at build time → `STYLE_URL` and `CONTOURS_SOURCE_URL` constants in `Map.tsx` → `maplibregl.Map` fetches `outdoor-v2` style from MapTiler → on `load`: native contour layers hidden, `contours-v2` source registered, explicit contour layers added → MapLibre renders tiles and isolines.

### Error Handling

If the key is missing, Vite inlines `undefined`, URLs are malformed, and MapLibre renders an empty map. No additional handling for this issue.

### Testing

- `.env.test` sets `VITE_MAPTILER_API_KEY=test-key` so `import.meta.env` resolves in Vitest.
- Extend the `maplibregl.Map` mock to expose `addSource`, `addLayer`, and `setLayoutProperty` spies.
- Trigger the `load` event in tests by capturing the `on('load', cb)` callback and invoking it manually.
- Assert: style URL contains `outdoor-v2` and `test-key`; `setLayoutProperty` called for each native contour layer; `addSource` called with `contours-v2` URL; `addLayer` called for each explicit contour layer.

## Open Questions

- Native contour layer IDs in `outdoor-v2` — must be identified by inspecting the style JSON (`https://api.maptiler.com/maps/outdoor-v2/style.json?key=KEY`) with a real API key during implementation. Needed to call `setLayoutProperty(..., 'visibility', 'none')` correctly.
