# 002. Manage contour layers in code rather than forking the MapTiler style

**Date:** 2026-05-05
**Status:** Accepted

## Context

Issue #8 adds elevation isolines to the map. MapTiler's `outdoor-v2` style includes native contour layers. Two approaches were available: fork `outdoor-v2` in MapTiler Cloud (remove its native contour layers, save as a custom style) and add contours explicitly in code, or use `outdoor-v2` as-is, hide its native contour layers at runtime, and add our own layers backed by the `contours-v2` vector source.

## Decision

Use `outdoor-v2` unmodified as the base style. On `map.on('load')`, hide its native contour layers via `setLayoutProperty(..., 'visibility', 'none')` and add explicit layers backed by MapTiler's `contours-v2` vector source. All contour logic lives in `Map.tsx`.

## Alternatives Considered

- **Forked custom style in MapTiler Cloud** — remove native contour layers in the style editor, save as a custom URL. Rejected because: the custom style is external state outside the repo and not version-controlled; it won't auto-inherit future updates to `outdoor-v2`; and it adds a manual setup step invisible to contributors.

## Consequences

- All layer logic is versioned in the codebase — visible and reviewable.
- Future toggling of contours is straightforward: `setLayoutProperty` on our own layer IDs.
- Native contour layer IDs in `outdoor-v2` must be discovered at implementation time by inspecting the style JSON — they are not hardcoded in MapTiler's public documentation.
- If MapTiler renames native contour layers in a future `outdoor-v2` update, the `setLayoutProperty` hide calls become no-ops (harmless — our explicit layers still render correctly).

## References

- Issue #8 — Wire up MapTiler tiles and API key
- MapTiler contours schema: https://docs.maptiler.com/schema/contours/
