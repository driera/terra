# Plan: Wire up MapTiler tiles and API key

## Context

This issue replaces the hardcoded OpenFreeMap tile URL in `Map.tsx` with MapTiler's `outdoor-v2` style, which provides a richer outdoor/terrain aesthetic. It also adds elevation isolines as explicit, code-owned layers — rather than relying on the ones baked into `outdoor-v2` — so they can be styled and toggled independently in the future.

The approach: use `outdoor-v2` unmodified as the base style. On `map.on('load')`, hide `outdoor-v2`'s native contour layers via `setLayoutProperty(..., 'visibility', 'none')`, register the `contours-v2` vector tile source, and add explicit contour line and label layers.

The MapTiler API key is loaded from `import.meta.env.VITE_MAPTILER_API_KEY` — inlined by Vite at build time. It must never be committed.

**Files involved:**

- `src/Map/Map.tsx` — the only component; replace `STYLE_URL` and add `map.on('load')` layer setup
- `src/Map/Map.test.tsx` — update style URL assertion, add tests for load handler behaviour
- `.env.example` — new file documenting the required env var for contributors
- `.env.test` — new file providing a fake key for Vitest
- `.github/workflows/ci.yml` — pass the secret to the build step

**Patterns to follow:**

- `vi.mock('maplibre-gl', ...)` pattern already in `Map.test.tsx` — extend the mock, don't replace it
- Constants extracted at module scope (see `STYLE_URL`, `DEFAULT_CENTER`, `DEFAULT_ZOOM`) — add `CONTOURS_SOURCE_URL` the same way
- CSS Modules for any styling; no inline styles

**Non-obvious constraint:** Native contour layer IDs inside `outdoor-v2` must be discovered by fetching the style JSON with a real API key during implementation (`https://api.maptiler.com/maps/outdoor-v2/style.json?key=YOUR_KEY`). Look for layers whose IDs contain `contour`. These are the IDs passed to `setLayoutProperty`.

## Tasks

### 1. Identify native contour layer IDs in `outdoor-v2`

Before writing any code, fetch the `outdoor-v2` style JSON with a real API key and extract all layer IDs that contain the word `contour`. These are the IDs to be hidden in task 2.

This is a research step — no code to write. Record the IDs in a comment at the top of the `map.on('load')` handler for future reference.

Test cases: none — discovery only.

What to implement:
- List of native contour layer IDs known and recorded

---

### 2. Replace tile source and add contour layers

Replace `STYLE_URL` in `Map.tsx` with the MapTiler `outdoor-v2` URL built from the env var. Add a `map.on('load')` handler that hides `outdoor-v2`'s native contour layers, registers the `contours-v2` vector source, and adds explicit contour line and label layers.

Types to define:
- None beyond existing types

Test cases:
- `maplibregl.Map` constructor is called with a style URL containing `outdoor-v2` and `test-key`
- `on('load', cb)` is registered; when the callback fires: `setLayoutProperty` is called with `'visibility', 'none'` for each native contour layer ID; `addSource` is called once with the `contours-v2` TileJSON URL containing `test-key`; `addLayer` is called for the contour line layer and the contour label layer
- Existing tests still pass (container renders, `window.map` assigned, cleanup on unmount, axe)

What to implement:
- `STYLE_URL` → `` `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}` ``
- `CONTOURS_SOURCE_URL` → `` `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}` ``
- `map.on('load', () => { ... })` — hide native contour layers, add source, add line + label layers
- `source-layer: 'contour'` (metres) for both line and label layers

Commit: `feat: switch to MapTiler outdoor-v2 with explicit contour layers (#8)`

---

### 3. Obtain and configure the MapTiler API key

Get a MapTiler API key and make it available locally and in GitHub.

Steps for the developer:
1. Log in at https://cloud.maptiler.com and go to Account → API keys
2. Create a new key named `terra` (or use the default key)
3. Copy the key value
4. Create `.env.local` in the project root with `VITE_MAPTILER_API_KEY=<your-key>` — this file is gitignored and never committed
5. Add the key as a GitHub secret: run `gh secret set VITE_MAPTILER_API_KEY` and paste the key when prompted
6. Verify the secret was set: `gh secret list`

Test cases: none — configuration only.

What to implement:
- `.env.local` exists locally with a valid key (not committed)
- GitHub secret `VITE_MAPTILER_API_KEY` is set on the repo

---

### 4. Wire up API key in env files and CI

Create the env files contributors need and add the secret to the CI build step.

Test cases: none — configuration only. Verified by a passing CI run after the secret is set in GitHub.

What to implement:
- `.env.example` with `VITE_MAPTILER_API_KEY=` (empty value, with a comment pointing to cloud.maptiler.com)
- `.env.test` with `VITE_MAPTILER_API_KEY=test-key`
- `.github/workflows/ci.yml` build step: add `env: VITE_MAPTILER_API_KEY: ${{ secrets.VITE_MAPTILER_API_KEY }}`

Commit: `chore: add MapTiler API key to env files and CI (#8)`
