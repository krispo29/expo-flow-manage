# Badge layout reliability and operator UX design

## Goal

Make the layout editor safe for ordinary operations staff to use without developer intervention, while making print acceptance evidence explicit and repeatable.

## Decisions

### 1. Verification is a product workflow, not a claim from unit tests

The system will provide an in-product verification checklist per project: save draft, test-print current draft, review automatic geometry/overflow warnings, publish only after the test-print step, and record the revision/time locally in the acceptance record. A test token is `{projectUuid, draftRevision, layoutFingerprint, testedAt}`. Publish is enabled only when all four values match the current server-backed draft and local layout and the token is younger than 24 hours. Any edit, undo, redo, starter/reset action, recovery, reload/conflict, or failed/expired test invalidates it. It will make browser and printer settings visible: actual scale 100%, matching paper size, no margins, headers and footers off.

The local acceptance record uses `badge-layout.acceptance.v1.<projectUuid>`, is scoped to this browser/workstation, and stores only the test token, paper dimensions and chosen calibration offsets. It is retained until a newer valid test replaces it or the operator clears browser storage. Corrupt/quota/security failures are non-fatal and visibly state that this is local convenience evidence, not a server audit record.

The existing calibration page remains the physical test tool. It prints fixed 10 mm rulers and crosshairs using no attendee data. It cannot determine a physical measurement automatically; the operator measures the print, enters the per-workstation X/Y offset, then repeats the print. The UI must explicitly distinguish uniform position error (calibrate) from scale error (fix browser/driver settings).

An automated release command remains deliberately opt-in: backend state lifecycle tests only run when both `BADGE_LAYOUT_TEST_DATABASE_URL` and `BADGE_LAYOUT_TEST_CONFIRM_DISPOSABLE=1` are supplied. Test code never reads application `.env`; it requires the database name to contain `_test`, creates a unique `badge_layout_test_` schema, writes a marker inside that schema, and rejects a missing/non-test target before any schema operation. It never touches `public` or an existing non-owned schema. Negative tests cover absent confirmation, a normal application URL, and a database name without the test suffix.

### 2. Undo, redo and local recovery apply only to an unpublished local working copy

Each open editor maintains a bounded undo/redo stack of 50 immutable deep-copied validated layouts in memory, including the initial loaded/recovered layout. Every field/paper/visibility/typography/image/starter/reset action creates one entry; a complete drag or resize creates one entry at pointer release, rather than one per mouse move. A failed Save changes no history. `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` and visible buttons work unless the focus is a text input/select/editable element.

The current dirty layout is checkpointed in browser local storage under a versioned, project-scoped key. It contains a version, base draft revision, timestamp and layout, never credentials or publication data. JSON is parsed and schema-validated before showing a prompt; malformed, obsolete/future-version, invalid, quota/security, missing-draft or revision-0 state is only discardable and never blocks normal editing. On next open, an operator is offered Restore or Discard only when the saved base revision matches the fetched server draft revision. The revision is rechecked when restoring and before Save/Publish; a mismatch is shown as stale recovery and cannot overwrite server state. Saving or successfully publishing clears the checkpoint. A recovery failure never blocks normal editing.

No collaborative live editing, server-side autosave, or cross-device recovery is added in this phase. Optimistic concurrency on explicit Save/Publish remains the authority.

### 3. Editor defaults to operational language and common actions

The property panel will label values in operational terms: Left/Top/Width/Height, Text size, Smallest text size, Text alignment, Capital letters, and Long-text behavior. Technical units remain visible as `mm` and `pt`.

Frequently used actions are one click: center horizontally, center vertically, center on paper, reset selected field to its starter position, and choose Default / ILDEX / THAILAB starter. Starter selection replaces the complete local layout (paper, artwork reference and every field) as one undoable entry; it requires confirmation whenever the whole local layout is dirty, and no confirmation when it is clean. “Starter position” means every property of the selected field from the currently selected project starter (Default / ILDEX / THAILAB), with confirmation only when it overwrites a dirty field; it is one undoable action. Typography and fine controls live in an `Advanced text settings` disclosure, preserving full control without confronting normal users with every knob. Existing keyboard movement, snapping, warnings and numerical entry remain available.

### Error handling and safety

- Invalid layouts cannot be saved, test-printed or published.
- Local recovery is removed only after successful save/publish or explicit discard; failed requests preserve it.
- Undo never changes a published revision or calls the API.
- Print test/publish requirements remain unchanged: reference artwork stays editor-only.

### Verification

- Unit tests cover 50-entry boundaries, immutable snapshots, redo invalidation, drag coalescing, keyboard-input exclusions, checkpoint compatibility/staleness/clear rules, revision-0/malformed/quota branches, test-token invalidation/expiry, and exact quick-action geometry.
- Component tests cover recovery prompt, clean/dirty starter replacement, friendly labels, advanced disclosure, and publish-after-tested-save.
- Backend disposable lifecycle test stays opt-in.
- Manual acceptance requires the existing calibration print and an actual preprinted badge for each active project.

## Out of scope

- Multiple layouts per attendee type
- Server-side autosave or real-time collaboration
- Font uploads or arbitrary artwork printing
- Automatic printer measurement
