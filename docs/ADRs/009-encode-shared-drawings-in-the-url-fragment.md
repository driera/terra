# 009. Encode shared drawings in the URL fragment

**Date:** 2026-06-11
**Status:** Accepted

## Context

Sharing a drawing via URL is the keystone of the MVP (issue #18) and was
blocked by an open prerequisite in GOALS.md: URL encoding vs. backend
storage. Forces at play:

- Terra deploys as a static site on GitHub Pages — no server available,
  and TECH.md constrains sharing to stay fully client-side.
- Geometries are stored internally as GeoJSON Features (ADR 007).
- The roadmap keeps adding feature-level data: POI labels (#23),
  elevation (#20), GeoJSON export (#22) — the share format must absorb
  new properties without redesign.
- Shared links travel through messengers and social apps; URLs should
  stay comfortably under ~2k characters for typical drawings.

## Decision

Serialize the drawing as precision-trimmed GeoJSON (5 decimals ≈ 1 m),
compress with the native `CompressionStream` (`deflate-raw`), encode as
base64url, and place it in the URL fragment with a version prefix:

```
https://…/#v1.<base64url-payload>
```

- Zero dependencies — `CompressionStream` is native in all target browsers.
- Any future feature `properties` serialize for free; the wire format is
  the internal model.
- The `v1.` prefix allows the format to evolve without breaking old links.
- The fragment (`#`) keeps payloads out of server logs and avoids any
  request-size limits.

## Alternatives Considered

- **Polyline encoding per geometry (+ custom envelope)** — shortest URLs
  (~3× smaller) and sync decode, but polyline encodes only coordinate
  sequences. Geometry types, multiple features, and every future property
  (POI names, elevation, styling) would require extending a custom format:
  recurring encoder/decoder/compat work to save bytes on URLs already
  within budget. Rejected.
- **Backend storage (short links)** — pretty ~30-char URLs and a path to
  OG previews, but adds infra Terra doesn't have (GitHub Pages can't host
  it), an unauthenticated write endpoint to protect, and a liveness
  obligation: stored links rot if the service stops; embedded links work
  forever. Not chosen now, but **composable later**: a short-link service
  would store the same versioned payload and resolve to it, with no change
  to the client decode path.

## Consequences

- #18 is unblocked with no new dependencies or infra.
- GeoJSON export (#22) becomes trivial — the share payload is GeoJSON.
- Decoding is async (`DecompressionStream`) — a one-time await at app load.
- URLs run ~1–1.5k chars for typical drawings; very large drawings could
  exceed messenger-friendly lengths. Revisit (compression tuning or the
  backend layer) if real drawings approach ~8k.
- Coordinate precision is capped at 5 decimals in shared links.

## References

- Issue #18 — share a drawing via URL
- ADR 007 — store geometries as Features
- Prior art: geovara (LZW/lz-string GeoJSON-in-URL) — validated the
  stateless approach; lz-string superseded by native CompressionStream
