# 007. Store geometries as `Feature<TerraGeometry>` from the start

**Date:** 2026-05-18
**Status:** Accepted

## Context

Issue #12 introduces GeometryStore, which holds completed user-drawn shapes. The question was whether to store them as bare GeoJSON geometry objects (`LineString`, `Point`, `Polygon`) or as full GeoJSON `Feature` objects with `id` and `properties`.

## Decision

Store as `GeoJSON.Feature<TerraGeometry>[]` from day one, where `TerraGeometry = LineString | Point | Polygon`. A named type alias (`TerraGeometry`) constrains the union to geometry types Terra supports.

## Alternatives Considered

- *Bare geometry objects* (`LineString[]`) — simpler initially. Rejected: when geometries become selectable, editable, or labelled, each needs an `id` and `properties`. Migrating the store type at that point would break all consumers. The Feature wrapper costs nothing now.
- *`GeoJSON.Geometry` union* — accepts any geometry type including unsupported ones (MultiPolygon, GeometryCollection). Rejected: too permissive; `TerraGeometry` encodes which types the app actually supports.

## Consequences

- Each feature can carry an `id` and `properties` when needed — no breaking store change required
- Wrapping geometries in a Feature for map sources is trivial (they already are Features)
- The `TerraGeometry` alias becomes the canonical type to extend when new geometry types are added

## References

- Issue #12: Draw lines on the map
- GeoJSON spec: RFC 7946
