# 001. Use MapLibre GL JS directly without a React wrapper

**Date:** 2026-04-04
**Status:** Accepted

## Context

Terra needs an interactive map. Several React-specific wrappers exist for MapLibre/Mapbox (react-map-gl, maplibre-react-components). The choice between direct integration and a wrapper affects how much control we have over the map instance — relevant because upcoming issues require low-level access for custom drawing tools and 3D terrain.

## Decision

Use `maplibre-gl` directly. A thin `<Map />` component owns the instance via `useRef` + `useEffect`. No React adapter library.

## Alternatives Considered

- **react-map-gl** — declarative layer API, good DX for simple maps. Adds an abstraction layer that may conflict with direct map instance access needed for drawing tools and terrain. Also carries Mapbox heritage and a heavier API surface.
- **maplibre-react-components** — lighter and MapLibre-native, but less mature and the same fundamental tradeoff applies.

## Consequences

- More boilerplate per component, but full control over the map instance at all times.
- Drawing tools and terrain work (#8, #9 and beyond) can call the MapLibre API directly without unwrapping or bypassing the adapter.
- If a wrapper is adopted later, migration is straightforward — the map instance is already isolated in one component.

## References

- Issue #7
