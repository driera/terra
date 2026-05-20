# 008. Accessibility target: WCAG 2.1 AA with map canvas carve-out

**Date:** 2026-05-20
**Status:** Accepted

## Context

Terra is a map-heavy application with inherently visual interactions — drawing on a canvas, exploring terrain in 3D, reading coordinate overlays that update on every pointer move. These create real tension with full accessibility conformance: the map canvas has no meaningful screen-reader equivalent, and some interactions (drawing by clicking on the map) have no keyboard-only path that doesn't fundamentally change the product. All surrounding UI chrome (toolbar, footer, controls, HUDs) is standard DOM and fully amenable to accessible implementation.

## Decision

Target WCAG 2.1 AA for all UI chrome. The map canvas itself is explicitly exempted — it has no accessible text equivalent and follows the same documented carve-out pattern used by Google Maps, Mapbox, and other geospatial tools. Live regions (`aria-live="polite"` + `aria-atomic="true"`) are used for dynamic content that updates in response to user actions (e.g. drawing metadata). Every new UI component must pass axe with zero violations before merging.

## Alternatives Considered

- **WCAG 2.1 AA without carve-out** — claiming full AA while leaving the map canvas behaviour implicit. Rejected: dishonest and harder to reason about in future component decisions.
- **WCAG 2.1 AAA** — full conformance including AAA criteria. Rejected: widely considered unachievable for dynamic geospatial interfaces; no major mapping product targets it.

## Consequences

- All controls, overlays, and HUD components must be keyboard-navigable and screen-reader friendly
- Dynamic content (coordinates, drawing metadata) uses `aria-live` regions — polite by default, never assertive unless the change is critical
- Map canvas interactions (drawing, panning, zooming) are keyboard-supported where feasible but are not required to have screen-reader equivalents
- axe zero-violations is a hard gate per component, already enforced in existing tests

## References

- [WCAG 2.1 AA](https://www.w3.org/TR/WCAG21/)
- [Google Maps Accessibility](https://support.google.com/maps/answer/6396990)
