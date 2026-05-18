# Terra

> Draw geospatial shapes, explore them in 3D terrain, and share them — no account required.

**Built with** React 19 · TypeScript (strict) · MapLibre GL · Vite · Vitest

[Live demo](https://driera.github.io/terra/) · [Goals](GOALS.md) · [Tech](TECH.md) · [ADRs](docs/ADRs/) · [Roadmap](https://github.com/users/driera/projects/2)

<!-- TODO: add screenshot / short GIF -->

## What it is

Terra is a focused web tool for drawing geospatial shapes on a map. Click to place vertices, edit the result, switch to a 3D terrain view to see how the shape sits in the landscape, then share it via URL or export as GeoJSON — no account required.

I'm building it exploring map UI, accessibility on a notoriously inaccessible surface, and an architecture that stays clean as features stack up.

## Status

MVP in progress

| Area | Status |
| --- | --- |
| Navigable 2D map (MapLibre + MapTiler) | Shipped |
| Custom zoom controls, geolocation centering, coordinates HUD | Shipped |
| Line drawing (click to place, Enter to complete, Escape to cancel) | Shipped |
| Polygon + point drawing | Planned |
| Shape editing (move vertices, delete) | Planned |
| 3D terrain view with smooth 2D ↔ 3D transition | Planned |
| URL-based sharing (no backend) | Planned |
| GeoJSON export | Planned |

The roadmap on [GitHub Projects](https://github.com/users/driera/projects/2) tracks what's next.

## Engineering practices

The choices that shaped the codebase — most are documented in [ADRs](docs/ADRs/):

- **TDD throughout** — tests written before or alongside every feature; 100%+ of `src/` is covered by Vitest + React Testing Library
- **Architecture decisions recorded** — seven ADRs so far covering map facade, plugin registry, reactive state pattern, and drawing orchestration
- **Accessibility verified** — `jest-axe` checks on every interactive component; keyboard shortcuts on the map UI
- **Plugin architecture for the map** — `mapApi` exposes a single load-aware facade; geometry features ship as self-contained plugins (see [ADR 005](docs/ADRs/005-mapapi-plugin-registry-directory.md), [ADR 006](docs/ADRs/006-drawing-plugin-as-single-orchestrator.md))
- **Pure reactive stores** — `Store<T>` + `useX(keys)` hook pattern keeps state containers free of side effects (see [ADR 004](docs/ADRs/004-store-and-hook-pattern-for-reactive-map-state.md))
- **Short, conventional commits** — `feat:`/`fix:`/`refactor:` etc., one logical change per commit
- **CI on every push** — lint, type-check, test, build, deploy to GitHub Pages

## Development

**Requirements:** Node.js, pnpm

```bash
pnpm install       # install dependencies
pnpm start         # dev server (Vite)
pnpm test          # tests in watch mode
pnpm test:run      # tests once (CI mode)
pnpm check-types   # tsc -b --noEmit
pnpm lint          # ESLint
pnpm build         # type-check + production build
```

A MapTiler API key is required for the base map — copy `.env.example` to `.env.local` and add `VITE_MAPTILER_API_KEY`.
