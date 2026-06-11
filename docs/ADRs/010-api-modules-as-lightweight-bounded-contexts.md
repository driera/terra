# 010. api/ modules as lightweight bounded contexts

**Date:** 2026-06-11
**Status:** Accepted

## Context

`src/api/` had grown into Terra's core but its boundary was convention-only.
The top-level barrel exported drawing commands twice — on the `mapApi` facade
(ADR 003) and as named exports — leaving call sites and test mocks without a
single contract. Nothing prevented UI code from importing api module
internals, or api code from reaching into components. Shared primitives
(`Store`, `logger`) floated without a home, `src/location/` was an api-style
module living among UI folders, and UI components were grouped by widget
type (`canvas/`, `controls/`, `hud/`) — splitting one capability's UI across
three folders.

## Decision

The tree states the architecture:

- **`src/api/`** — the core. Each module folder (`drawing/`, `pointer/`,
  `location/`) is a lightweight bounded context holding, by file convention
  rather than layered folders: pure domain logic, a `Store` (ADR 004), a map
  plugin/orchestrator (ADR 005/006), and a React hook.
- **`src/features/`** — the presentation layer, grouped by capability and
  mirroring api modules (`features/map/`, `features/drawing/`). A new
  capability gets one folder, not fragments across widget-type folders.
- **`src/ui/`** — design-system primitives shared across features
  (`ToolButton`).
- **`src/lib/`** — the shared kernel (`Store`, `logger`); knows neither
  react nor maplibre.
- **`src/App.tsx`** (+ `Logo`) — composition and layout.

Boundary rules, machine-enforced via two folder-level ESLint
`no-restricted-imports` blocks (stable as the tree grows — no per-file
globs):

- **Commands in via `mapApi`, state out via hooks.** The top-level barrel
  exports the facade (default), hooks (`usePointer`, `useDrawing`,
  `useInitialCenter`), read-side helpers (`Modes`, `formatDistance`), and
  types — nothing else. Commands are not duplicated as named exports.
- **Features import only the api barrel**, never module internals.
- **`api/` and `lib/` never import from `features/`, `ui/`, or `App`.**

Pure-domain purity inside api modules (stores and calculation files free of
react/maplibre imports) remains a reviewed convention, not a lint rule —
enforcing it required brittle per-file globs that silently rot.

## Alternatives Considered

- **Layered folders** (`api/domain/`, `api/application/`,
  `api/infrastructure/`) — horizontal layers trade cohesion for ceremony at
  this codebase size; module-per-context keeps each capability in one folder.
- **Abstracting MapLibre behind a port interface** — rejected; ADR 001
  deliberately couples to MapLibre GL JS.
- **Keeping dual command exports** — rejected; two blessed surfaces meant
  inconsistent call sites and double-shaped test mocks.
- **Widget-type UI grouping** (`canvas/controls/hud`) — rejected; roadmap
  capabilities (share, notifications, POIs) each arrive as one feature
  spanning several widget types.
- **Lint-enforced pure-domain rule / `eslint-plugin-boundaries`** — deferred;
  per-file globs rot silently, and the plugin earns its dependency only if a
  third boundary type appears.

## Consequences

- One mocking convention: tests mock `mapApi` for commands and hooks for
  state — resolves the open barrel-mocking question.
- Violations of the dependency direction fail `pnpm lint` instead of
  surfacing in review.
- New capabilities follow a known shape: api module (domain + store +
  plugin + hook, exported through the barrel) + one `features/` folder.
- `ui/` gives the design system (#24 follow-ups) a home.

## References

- Issue #25
- ADR 001 (MapLibre directly), 003 (mapApi facade), 004 (Store + hook),
  005 (plugin registry), 006 (drawing orchestrator)
