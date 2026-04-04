# Goals

> Product source of truth. Goals express outcomes, not solutions.
> Updated as the product evolves.

**Milestone 1 (MVP):** A user can draw geometries on a map, edit them, switch views, and share the result via a URL — no account required.

## Active

### Anyone can draw and edit geometries on a map and instantly share the result via a URL that reflects the current state

- **Subject**: Drawer

### Anyone who receives a shared link can explore the drawing and become a Drawer in seconds

- **Subject**: Viewer

### Users can switch between 2D/3D view, satellite/vector tiles, and elevation isolines to get the best context for their use case

- **Subject**: Both

## Proposed

### Users can measure distances along paths, accounting for elevation, to support outdoor planning

- **Subject**: Both

### Users can toggle map layers (roads, buildings, etc.) to customise the context around a drawing

- **Subject**: Both

### Users can export a drawing as GeoJSON to use in other tools

- **Subject**: Both

## Prerequisites

Design decisions that must be resolved before writing user stories.
Resolve each by triggering `write-adr` — open decision mode.

- [ ] URL encoding vs. backend storage for share links — determines whether v1 needs a backend and shapes the entire share architecture
