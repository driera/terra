# Backlog

Bootstrap backlog — initial issues to create before the delivery loop begins.
Work through these with `/write-issue` one by one.

## Product issues

- [ ] **View a navigable 2D map** — navigate using controls (zoom, center, rotate/tilt) _(user-story)_
- [ ] **Draw a line on the map** — draw from scratch or extend from an existing geometry _(user-story)_
- [ ] **Edit a geometry** — edit a drawn geometry to refine a drawing _(user-story)_
- [ ] **Delete a geometry** — remove a geometry from the drawing _(user-story)_
- [ ] **Inspect geometries** — hover to get coords and elevation of the closest point on any geometry _(user-story)_
- [ ] **Share a drawing via URL** — share via a URL that reflects current state, no account required _(user-story)_
- [ ] **Switch between 2D and 3D view** — toggle flat map and 3D terrain view _(user-story)_
- [ ] **Switch between satellite and vector tiles** — toggle satellite imagery and vector map tiles _(user-story)_
- [ ] **Toggle elevation isolines** — toggle isolines on/off to read terrain gradient _(user-story)_
- [ ] **Draw a point on the map** — place a point on an existing line or in a new location _(user-story)_

## Engineering tasks

- [ ] **Scaffold Vite + React + TypeScript project** — initialise with pnpm, configure tsconfig strict _(task)_
- [ ] **Set up ESLint** — configure for React + TypeScript _(task)_
- [ ] **Set up Prettier** — configure and integrate with ESLint _(task)_
- [ ] **Set up Vitest** — configure with React Testing Library _(task)_
- [ ] **Set up CI workflow** — lint → type-check → test → build on every PR and push to main _(task)_
- [ ] **Set up GitHub Pages deploy** — deploy to GitHub Pages after CI passes on main _(task)_
