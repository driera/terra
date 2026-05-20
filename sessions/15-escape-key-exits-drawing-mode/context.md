# Context: Escape key exits drawing mode

## Problem

Pressing Escape while in drawing mode calls `cancelDrawing()`, which clears the draft but leaves drawing mode active. This is inconsistent with standard conventions (Figma, Illustrator) and the keyboard/mouse symmetry established in issue #12.

### Problem Space

The toolbar maintains two parallel mode states: local React `mode` state (drives UI) and `mapApi` state (drives map cursor and drawing behavior). The current Escape handler only calls `mapApi.cancelDrawing()` — it never updates local React state, so the toolbar stays visually in draw mode even after Escape clears the draft.

The desired behavior is: Escape exits mode entirely (draft discarded + mode deactivated), consistent with:
- Enter draw mode: click line button
- Exit draw mode: click line button OR Escape
- Commit line: click Done OR Enter

### Edge Cases

- Escape when no mode is active: already a non-issue — the `useEffect` guard (`if (mode !== 'line') return`) prevents the listener from registering when idle.
- Draft with no vertices: `setMode(null)` calls `cancel()` internally, which calls `store.clearDraft()` — safe regardless of draft state.

### Constraints

- `_mode` is a private module-level variable in `drawing.ts`, not exposed through the reactive store. Toolbar must maintain its own local React state for UI rendering.
- `setMode(null)` in `drawing.ts` already calls `cancel()` when transitioning from active to null — draft discard is guaranteed.

## Solution

### Approach

Update the Escape handler in `DrawingToolbar` to update both local React state and API state, mirroring the pattern in `toggleLine`. No new abstractions or store changes needed.

### Architecture

No structural change. Same dual-state pattern (`useState` + `mapApi`), just a corrected Escape action.

### Components

**`DrawingToolbar.tsx`** — line 18 only:
- Replace `mapApi.cancelDrawing()` with `setMode(null); mapApi.setDrawingMode(null)`

### Dependencies

None.

### Data Flow

Escape keydown → `setMode(null)` (React state clears) → `useEffect` cleanup fires (listener removed, `mode !== 'line'` guard prevents re-registration) → `mapApi.setDrawingMode(null)` → cursor reset, draft discarded via `cancel()`.

### Error handling

No new error handling needed. Existing guard prevents Escape from firing when mode is inactive.

### Testing

One test needs updating in `DrawingToolbar.test.tsx`:
- Description: "Escape keydown calls cancelDrawing() when mode is active; mode stays active" → "Escape keydown exits drawing mode and discards draft"
- `aria-pressed` assertion: `true` → `false`
- Mock assertion: `cancelDrawing` called → `setDrawingMode` called with `null`

## Open Questions

None.
