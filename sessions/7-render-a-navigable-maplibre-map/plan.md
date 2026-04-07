# Plan: Render a navigable MapLibre map

## Context

This is the first real feature in Terra — replacing the `<h1>Terra</h1>` placeholder with a
full-viewport interactive map. It installs MapLibre GL JS, sets up PostCSS with nesting support,
builds a `<Map />` component that owns the map instance, and wires it into `App`.

Files involved:
- `src/App.tsx` — currently renders a heading; will render `<Map />` instead
- `src/App.test.tsx` — currently tests the heading; must be updated
- `src/Map/Map.tsx` — new component (to create)
- `src/Map/Map.module.css` — new CSS module (to create)
- `src/Map/Map.test.tsx` — new test file (to create)
- `src/Map/index.ts` — barrel export (to create)
- `src/global.d.ts` — global Window type augmentation (to create)
- `postcss.config.ts` — PostCSS config (to create)

Architecture follows a domain-based structure: everything belonging to the Map domain lives in
`src/Map/`. Shared pieces (none yet) would go in `src/shared/` at the same level.

Styling rules:
- CSS Modules only — always classes, never element selectors or inline styles
- Class names: kebab-case in `.module.css` files, camelCase when referenced in TSX
- PostCSS nesting enabled via `postcss-preset-env`

Testing rules:
- MapLibre cannot render in jsdom (no WebGL) — mock the `Map` constructor minimally to prevent
  the WebGL crash, then use `vi.spyOn` to assert what our code calls
- We test our orchestration (constructor options, cleanup), not MapLibre's own behavior

`window.map` is assigned the map instance on mount (for browser inspection and E2E hooks) and
deleted on unmount. The global type is declared in `src/global.d.ts`.

## Tasks

### [x] 1. Install dependencies and set up PostCSS

Install runtime and dev dependencies, then create the PostCSS config.

What to implement:
- `pnpm add maplibre-gl`
- `pnpm add -D jest-axe @types/jest-axe postcss-preset-env`
- Create `postcss.config.ts` that enables `postcss-preset-env` (enables nesting and modern CSS)

Commit: `chore: install maplibre-gl, jest-axe, postcss-preset-env (#7)`

---

### 2. Declare global Window type

Create `src/global.d.ts` to extend the Window interface so `window.map` is typed and doesn't
produce TS errors in component code or tests.

Types to define:
- `interface Window { map?: maplibregl.Map }` — optional, since it's only present while the Map
  component is mounted

Test cases: none — type declaration only.

What to implement:
- `src/global.d.ts` with the Window augmentation

### 3. Build the Map component

Create the Map domain: component, styles, tests, and barrel.

The component renders a full-viewport `<div>` (via a CSS module class), initialises a
`maplibregl.Map` on mount, assigns the instance to `window.map`, and cleans both up on unmount.
OpenFreeMap liberty style is the tile source. Attribution uses MapLibre's built-in
`AttributionControl`.

Types to define: none beyond the global Window type from task 2.

Test cases (mock `maplibre-gl` Map constructor to prevent WebGL crash; spy to assert behavior):
- The map container `<div>` is present in the DOM after render
- `maplibregl.Map` constructor is called once with: the container element, the OpenFreeMap
  liberty style URL (`https://tiles.openfreemap.org/styles/liberty`), a default center, and a
  default zoom level
- `window.map` is set to the map instance after mount
- `map.remove()` is called and `window.map` is deleted when the component unmounts
- A11y: `axe` reports zero violations on the rendered output

What to implement:
- `src/Map/Map.module.css` — `.map-container { width: 100dvw; height: 100dvh; }`
- `src/Map/Map.tsx` — renders the container div (`styles.mapContainer`), imports
  `maplibre-gl/dist/maplibre-gl.css`, initialises map in `useEffect`, assigns/deletes
  `window.map`
- `src/Map/index.ts` — barrel: `export { default as Map } from './Map'`

### 4. Wire Map into App

Replace the `<h1>Terra</h1>` placeholder in `App.tsx` with `<Map />`. Update `App.test.tsx`
to reflect the new structure.

Test cases (mock `maplibre-gl` Map constructor):
- `App` renders without crashing
- A11y: `axe` reports zero violations on the rendered `App`

What to implement:
- `App.tsx` imports `Map` from `./Map` and renders it (remove heading and `<main>` wrapper)
- `App.test.tsx` updated — smoke test + axe check, remove the heading assertion

Commit: `feat: render MapLibre map with OpenFreeMap tiles (#7)`
