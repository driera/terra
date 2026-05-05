# 002. Use a custom MapTiler style as the base map

**Date:** 2026-05-05
**Status:** Accepted (revised)

## Context

Issue #8 adds MapTiler tiles and elevation isolines. The base map style needs to have an outdoor/terrain aesthetic without unwanted layers (POI, trails, native contours, etc.). Three approaches were considered: use `outdoor-v2` as-is and hide unwanted layers at runtime; fork `outdoor-v2` in MapTiler Cloud to remove those layers; or use a lean custom style built from scratch.

During implementation, the runtime-hiding approach was tried first but rejected after discovering that the native contour layer IDs are not documented publicly (requiring style JSON inspection), and that hiding layers at runtime couples the code to MapTiler's internal layer naming. A custom style was created instead.

## Decision

Use a custom MapTiler style (`019df8cf-b54b-74e9-81d2-7c1f124b88dd`) forked from `outdoor-v2` with POI, trails, native contours, and other unwanted layers removed. The style is referenced by its stable ID. Elevation isolines are added explicitly in code via the `contours-v2` vector source — no runtime layer hiding needed.

## Alternatives Considered

- **`outdoor-v2` + runtime layer hiding** — use `outdoor-v2` unmodified and call `setLayoutProperty(..., 'visibility', 'none')` on native contour layers after load. Rejected because: native layer IDs are undocumented and must be discovered by inspecting the style JSON; runtime hiding couples code to MapTiler's internal naming; unwanted layers (POI, trails) would also need hiding, increasing fragility.

- **`outdoor-v2` unmodified** — simplest, but includes layers we don't want with no clean way to remove them without code coupling.

## Consequences

- `Map.tsx` has no runtime layer-hiding logic — simpler and more stable.
- The custom style is external state in MapTiler Cloud; it won't auto-inherit future updates to `outdoor-v2`. Style updates must be applied manually.
- The style ID is stable and safe to commit — it requires the API key to render, which is managed separately.
- Future layer additions (drawing layers, 3D terrain) are added entirely in code against a clean base.

## References

- Issue #8 — Wire up MapTiler tiles and API key
- MapTiler contours schema: https://docs.maptiler.com/schema/contours/
