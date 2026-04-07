# Terra

> Draw geospatial shapes, explore them in 3D terrain, and share them — no account required.

## What it is

Terra is a focused drawing tool for the web. Open it, draw polygons, lines, or points on a map, switch to a 3D terrain view to see how they sit in the landscape, and export as GeoJSON or share via a link.

No account needed to get started. Cloud persistence and shareable URLs are opt-in.

## What's built here

- Geospatial drawing tools — shape editing, snapping, coordinate precision
- 3D terrain visualization — live transition between flat map and terrain view
- Accessible map UI — keyboard navigation and screen reader support on a notoriously inaccessible surface
- Auth-optional architecture — anonymous use with optional persistence and URL-based sharing
- Real API and error states — loading, failure, and empty states handled throughout

## Status

Current milestone: `MVP — in progress`
[Goals →](GOALS.md) · [Tech →](TECH.md) · [Roadmap →](https://github.com/users/driera/projects/2)

## Development

**Requirements:** Node.js, pnpm

```bash
pnpm install       # install dependencies
pnpm start         # dev server (Vite)
pnpm test          # run tests in watch mode (Vitest)
pnpm build         # type-check + production build
pnpm lint          # ESLint
pnpm format        # Prettier
```
