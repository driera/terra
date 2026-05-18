# 006. Drawing plugin as single orchestrator

**Date:** 2026-05-18
**Status:** Accepted

## Context

Issue #12 introduces a drawing plugin that must handle map events (click, mousemove), interpret them as geometry operations (append vertex, update cursor), and keep two GeoJSON sources (`terra-draft`, `terra-features`) in sync. Three layers were involved: the drawing plugin, GeometryStore, and React. The question was which layer should own domain logic (what makes a valid line, when to finalize) and map source sync.

## Decision

The drawing plugin owns events, domain logic, and source sync. After each store mutation the plugin calls a private `_syncToMap()` that builds FeatureCollections and writes them to the map sources directly. GeometryStore is a pure state container with zero map knowledge. React only issues high-level commands (`setMode`, `cancel`, `complete`).

## Alternatives Considered

- *GeometryStore owns sync* — store calls `getSource().setData()` after each mutation. Rejected: forces GeometryStore to hold a map reference, coupling a state primitive to MapLibre. Makes GeometryStore tests require a map mock.
- *React owns domain logic* — mode-aware event handlers attached/detached via `useEffect`. Rejected: React component lifecycle becomes entangled with map event wiring; the plugin already holds `_map` and is the natural place for event interpretation.

## Consequences

- GeometryStore is purely testable without a map mock — tests cover only state transitions
- Plugin tests are the integration point: they verify the full event → store → sync pipeline with a map mock
- Future geometry types (polygon, point) extend the plugin's domain logic, not the store
- Plugin is heavier than `pointer` (which only tracks state) — a deliberate trade-off for a cleaner store

## References

- Issue #12: Draw lines on the map
- ADR 004: Store and hook pattern for reactive map state
- ADR 005: mapApi plugin registry
