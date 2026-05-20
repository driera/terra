# Plan: Escape key exits drawing mode

## Context

Currently, pressing Escape while drawing calls `mapApi.cancelDrawing()` — this clears the draft vertices but leaves draw mode active. The toolbar button stays pressed and the cursor stays in crosshair mode. The fix makes Escape exit mode entirely, matching the behavior of clicking the line button a second time.

The toolbar (`src/controls/DrawingToolbar.tsx`) keeps two parallel mode states in sync: a local React `useState` (drives button `aria-pressed` and conditional Done button) and `mapApi.setDrawingMode()` (drives map cursor and drawing plugin). The `toggleLine` handler already demonstrates the correct pattern — it updates both states together. The Escape handler must do the same.

`setMode(null)` in `drawing.ts` already calls `cancel()` internally when transitioning from active to null, so draft discard is guaranteed — no extra call needed.

Files involved:
- `src/controls/DrawingToolbar.tsx` — line 18: the Escape handler to fix
- `src/controls/DrawingToolbar.test.tsx` — one test to update

## Tasks

### [x] 1. Update Escape handler to exit drawing mode

Fix the Escape key handler so it exits draw mode entirely instead of only clearing the draft.

Test cases (update existing test, don't add new ones):
- Escape while in draw mode: `aria-pressed` on the line button becomes `false`
- Escape while in draw mode: `mapApi.setDrawingMode` is called with `null`
- Escape while in draw mode: `mapApi.cancelDrawing` is NOT called
- Escape when mode is inactive: no mapApi calls (existing test, verify it still passes)

What to implement:
- In the `onKeyDown` handler, replace `mapApi.cancelDrawing()` with `setMode(null)` (React state) and `mapApi.setDrawingMode(null)` (API state)

Commit: `fix(drawing): Escape key exits drawing mode`
