# Badge layout reliability and operator UX design

## Goal

Make the layout editor safe for ordinary operations staff to use without developer intervention, while making print acceptance evidence explicit and repeatable.

## Decisions

### 1. Verification is a product workflow, not a claim from unit tests

The system will provide an in-product verification checklist per project: save draft, test-print current draft, review automatic geometry/overflow warnings, publish only after the test-print step, and record the revision/time locally in the acceptance record. It will make browser and printer settings visible: actual scale 100%, matching paper size, no margins, headers and footers off.

The existing calibration page remains the physical test tool. It prints fixed 10 mm rulers and crosshairs using no attendee data. It cannot determine a physical measurement automatically; the operator measures the print, enters the per-workstation X/Y offset, then repeats the print. The UI must explicitly distinguish uniform position error (calibrate) from scale error (fix browser/driver settings).

An automated release command remains deliberately opt-in: backend state lifecycle tests only run when `BADGE_LAYOUT_TEST_DATABASE_URL` points to a disposable database. It cannot and must not select a production database from an application `.env`.

### 2. Undo, redo and local recovery apply only to an unpublished local working copy

Each open editor maintains a bounded undo/redo stack of validated layouts in memory. Every meaningful edit creates an entry; drag creates one entry at pointer release, rather than one per mouse move. `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` and visible buttons work unless the focus is a text input/select/editable element.

The current dirty layout is checkpointed in browser local storage under a versioned, project-scoped key. It contains the base draft revision and timestamp, never credentials or publication data. On next open, an operator is offered Restore or Discard only when the saved base revision matches the server draft revision. A mismatch is shown as stale recovery and cannot overwrite server state. Saving or successfully publishing clears the checkpoint. A recovery failure never blocks normal editing.

No collaborative live editing, server-side autosave, or cross-device recovery is added in this phase. Optimistic concurrency on explicit Save/Publish remains the authority.

### 3. Editor defaults to operational language and common actions

The property panel will label values in operational terms: Left/Top/Width/Height, Text size, Smallest text size, Text alignment, Capital letters, and Long-text behavior. Technical units remain visible as `mm` and `pt`.

Frequently used actions are one click: center horizontally, center vertically, center on paper, reset selected field to its starter position, and choose Default / ILDEX / THAILAB starter. Typography and fine controls live in an `Advanced text settings` disclosure, preserving full control without confronting normal users with every knob. Existing keyboard movement, snapping, warnings and numerical entry remain available.

### Error handling and safety

- Invalid layouts cannot be saved, test-printed or published.
- Local recovery is removed only after successful save/publish or explicit discard; failed requests preserve it.
- Undo never changes a published revision or calls the API.
- Print test/publish requirements remain unchanged: reference artwork stays editor-only.

### Verification

- Unit tests cover bounded history, redo invalidation, drag coalescing, keyboard-input exclusions, checkpoint compatibility/staleness/clear rules, and quick-action geometry.
- Component tests cover recovery prompt, friendly labels, advanced disclosure, and publish-after-tested-save.
- Backend disposable lifecycle test stays opt-in.
- Manual acceptance requires the existing calibration print and an actual preprinted badge for each active project.

## Out of scope

- Multiple layouts per attendee type
- Server-side autosave or real-time collaboration
- Font uploads or arbitrary artwork printing
- Automatic printer measurement
