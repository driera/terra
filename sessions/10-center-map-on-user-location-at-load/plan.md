# Plan: Center map on user location at load

## Context

On first load, `Map.tsx` opens on a hardcoded Barcelona center. This issue replaces that with a silent three-stage fallback: browser geolocation → IP-based city lookup → Spain default (zoom 3). The map renders immediately at Spain default; once location resolves it flies to the result.

All location logic lives in a new `src/location/` module — four files. `Map.tsx` stays thin: it calls the hook and reacts to the result.

**Files involved:**
- `src/location/types.ts` — new: shared `Coordinates` and `LocationResolver` types
- `src/location/getBrowserLocation.ts` — new: wraps `navigator.geolocation`
- `src/location/getIpLocation.ts` — new: fetches `https://ipapi.co/json/`
- `src/location/useInitialCenter.ts` — new: hook that runs the fallback chain via DI
- `src/Map/Map.tsx` — existing: swap Barcelona default for Spain, call the hook, fly on resolve
- `src/Map/Map.test.tsx` — existing: extend mock with `flyTo`, add hook integration tests

**Patterns to follow:**
- Test files live alongside their source file (same directory)
- maplibre-gl is mocked via `vi.mock` in Map tests; the mock object is extended per-test suite as needed
- All test files run `axe` for a11y (existing pattern — keep it in Map.test.tsx)
- Hook resolvers are injected as parameters with real implementations as defaults
- TDD: types → failing tests → implementation for each task

## Tasks

### 1. Define shared location types

Establishes the contract that both resolvers and the hook depend on. Everything else builds on this.

Types to define:
- `Coordinates = [number, number]` — `[longitude, latitude]`, matching MapLibre's convention
- `LocationResolver = () => Promise<Coordinates>` — the interface both resolvers implement

No tests needed — types only.

What to implement:
- `src/location/types.ts` exporting both types

---

### 2. Implement `getBrowserLocation`

Wraps `navigator.geolocation.getCurrentPosition` as a `LocationResolver`. Independently testable — no knowledge of the hook or the map.

Test cases (`src/location/getBrowserLocation.test.ts`):
- Resolves to `[longitude, latitude]` when geolocation succeeds
- Rejects when geolocation calls the error callback

What to implement:
- `src/location/getBrowserLocation.ts` — promisifies `getCurrentPosition`, returns `[coords.longitude, coords.latitude]`

---

### 3. Implement `getIpLocation`

Fetches `https://ipapi.co/json/` and extracts coordinates. Independently testable via a `fetch` stub.

Test cases (`src/location/getIpLocation.test.ts`):
- Resolves to `[longitude, latitude]` when response contains valid `latitude` and `longitude` fields
- Rejects when response is missing `latitude` or `longitude`
- Rejects when `fetch` throws (network failure)

What to implement:
- `src/location/getIpLocation.ts` — fetches `ipapi.co/json/`, validates fields, resolves `[longitude, latitude]` or rejects

Commit: `feat(location): add LocationResolver type, getBrowserLocation, getIpLocation`

---

### 4. Implement `useInitialCenter` hook

Orchestrates the fallback chain. Accepts both resolvers as parameters (DI) with real implementations as defaults. Returns `Coordinates | null`.

Test cases (`src/location/useInitialCenter.test.ts`, using `renderHook`):
- Returns `null` initially (before any resolver settles)
- Returns browser coordinates when `getBrowserLoc` resolves
- Returns IP coordinates when `getBrowserLoc` rejects and `getIpLoc` resolves
- Returns `null` when both resolvers reject (map stays at Spain default)
- Does not update state after unmount (cancelled flag prevents stale update)

What to implement:
- `src/location/useInitialCenter.ts` — `useState<Coordinates | null>(null)`, `useEffect` runs once on mount: tries `getBrowserLoc`, on failure tries `getIpLoc`, on failure does nothing. Cleanup sets a cancelled flag to prevent state updates after unmount.

Commit: `feat(location): add useInitialCenter hook with fallback chain`

---

### 5. Wire `useInitialCenter` into `Map.tsx`

`Map.tsx` gains location awareness. The map initialises at Spain default and flies to the resolved location when the hook returns non-null.

Test cases (extend `src/Map/Map.test.tsx`):
- `vi.mock('../../location/useInitialCenter')` — mock the hook at module boundary
- Add `flyTo: vi.fn()` to the maplibregl Map mock
- When hook returns `null`: `flyTo` is not called
- When hook returns coordinates: `flyTo` is called with `{ center: coords, zoom: 12 }`

What to implement:
- `Map.tsx`: change `DEFAULT_CENTER` to `[-3.7, 40.4]` and `DEFAULT_ZOOM` to `3`
- Call `useInitialCenter()` — result is `Coordinates | null`
- Add a `useEffect([center])` that calls `map.flyTo({ center, zoom: 12 })` when `center` is non-null (guard: map ref must be set)

Commit: `feat(map): center on user location at load with geolocation fallback chain`
