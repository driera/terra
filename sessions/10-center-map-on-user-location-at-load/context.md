# Context: Center map on user location at load

## Problem

On first load the map always opens on Barcelona at zoom 12, which is arbitrary for most users. This issue replaces that hardcoded default with a three-stage fallback: browser geolocation → IP-based city-level location → Spain at zoom 3. No user interaction required — resolution is automatic and silent.

### Problem Space

`Map.tsx` initialises with a hardcoded `DEFAULT_CENTER` and `DEFAULT_ZOOM`. No location resolution exists. The map must remain immediately visible (no loading screen) while the async resolution runs in the background, then fly to the resolved location once available.

Each session re-runs the full fallback chain. The browser remembers permission grants/denials, so the user is only prompted once — but the actual position lookup is fresh every load. Location persistence across sessions is a known follow-up (separate issue).

### Edge Cases

- Geolocation denied or timed out — falls through to IP lookup silently
- IP fetch fails (network offline, service down) — falls through to Spain default silently
- IP response missing coordinates — falls through to Spain default silently
- Both fail — map stays at Spain default, no error shown
- Hook resolves after component unmounts — state update must be cancelled (cleanup flag or AbortController)

### Constraints

- Map must render immediately at Spain default — no blocking on async resolution
- No new UI — purely initialisation logic
- No new packages — `fetch` is built-in, `ipapi.co` needs no API key
- IP provider decoupled behind the `LocationResolver` interface — swappable without touching the hook

## Solution

### Approach

Custom hook `useInitialCenter` with dependency injection. The fallback chain (browser → IP → default) lives in a dedicated `src/location/` module. Each resolver is a standalone async function implementing a shared `LocationResolver` type. The hook accepts the resolvers as parameters with real implementations as defaults — tests inject fakes, no `vi.mock` of external APIs needed.

`Map.tsx` remains thin: it calls the hook, initialises the map at Spain default, and flies to the resolved location when the hook returns non-null.

### Architecture

```
src/location/
  types.ts              — Coordinates type and LocationResolver contract
  getBrowserLocation.ts — wraps navigator.geolocation
  getIpLocation.ts      — wraps ipapi.co
  useInitialCenter.ts   — hook, orchestrates fallback chain via DI
```

`Map.tsx` consumes `useInitialCenter()`. No location logic in the component. The location module has no knowledge of the map.

### Components

- **`types.ts`** — `Coordinates = [number, number]`, `LocationResolver = () => Promise<Coordinates>`. Both resolvers implement this interface — swapping providers means writing a new function matching this type.

- **`getBrowserLocation.ts`** — wraps `navigator.geolocation.getCurrentPosition` in a Promise. Resolves to `[lng, lat]`, rejects on denial, unavailability, or timeout.

- **`getIpLocation.ts`** — fetches `https://ipapi.co/json/` (free tier, no API key, CORS-enabled). Extracts `latitude`/`longitude` and returns `[lng, lat]`. Rejects if fields are missing or fetch fails.

- **`useInitialCenter.ts`** — accepts `(getBrowserLoc: LocationResolver, getIpLoc: LocationResolver)` with real implementations as defaults. Runs once on mount: tries browser → tries IP → gives up. Returns `Coordinates | null` — null means both failed or still resolving; the caller uses Spain default.

- **`Map.tsx`** — calls `useInitialCenter()`. Map initialises at `DEFAULT_CENTER` (Spain, `[-3.7, 40.4]`), zoom 3. A second `useEffect` watches the hook's return: when non-null, calls `map.flyTo({ center, zoom: 12 })`.

### Dependencies

None. `fetch` is built-in. `ipapi.co` is free up to 1000 req/day — sufficient for MVP. No API key required.

### Data Flow

```
useInitialCenter() starts → returns null
  → tries getBrowserLocation()
      success → returns [lng, lat] → Map.flyTo(coords, zoom 12)
      fail    → tries getIpLocation()
                  success → returns [lng, lat] → Map.flyTo(coords, zoom 12)
                  fail    → stays null → Map stays at Spain default
```

`DEFAULT_CENTER` and `DEFAULT_ZOOM` (Spain fallback) stay in `Map.tsx` as map initialisation options — they are not part of the hook's return.

### Error Handling

All failures are silent — the chain falls through to the next option. No user-visible error state. `getBrowserLocation` and `getIpLocation` both reject on failure; the hook catches each and moves to the next step. A cancelled-flag in the hook's `useEffect` cleanup prevents state updates after unmount.

### Testing

- **`getBrowserLocation.test.ts`** — unit tests with a locally stubbed `navigator.geolocation` object (no jsdom dependency — stub in test scope). Assert resolves on success, rejects on error.
- **`getIpLocation.test.ts`** — mock `fetch` via `vi.fn()`. Test: success with valid coords, success with missing coords (rejects), network failure (rejects).
- **`useInitialCenter.test.ts`** — `renderHook` with injected fake resolvers covering all three scenarios: browser succeeds, browser fails + IP succeeds, both fail. Assert returned value per case.
- **`Map.test.tsx`** — mock `useInitialCenter` via `vi.mock` (module boundary — acceptable here). Add `flyTo` spy to the maplibregl mock. Assert `flyTo` called with resolved coords; assert not called when hook returns null.

## Open Questions

- None.
