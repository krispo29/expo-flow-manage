# Badge Layout Reliability and UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators recover/undo unpublished layout edits, use common layout actions without technical knowledge, and complete repeatable print verification.

**Architecture:** Keep all editing history and checkpointing client-side in a small `editor-draft` utility keyed by project and base draft revision. Keep the existing backend as the sole persistence and concurrency authority. Extend the existing editor with clear action labels and a compact acceptance card; physical measurement stays in the existing onsite calibration route.

**Tech Stack:** Next.js, React 19, TypeScript, Jest/Testing Library, browser localStorage, existing Go opt-in lifecycle test.

## Global Constraints

- Do not publish, migrate, deploy, or use production database credentials.
- Checkpoint only valid layouts; never store credentials, actor metadata, or published data.
- Do not add dependencies or new server endpoints.
- Retain legacy renderer fallback and existing Test Print → Publish gate.

---

### Task 1: Isolated layout history and recovery utility

**Files:**
- Create: `src/lib/badge-layout/editor-draft.ts`
- Test: `src/__tests__/lib/badge-layout/editor-draft.test.ts`

**Interfaces:**

```ts
type EditorCheckpoint = { baseDraftRevision: number; savedAt: string; layout: BadgeLayout }
export function createLayoutHistory(initial: BadgeLayout): LayoutHistory
export function saveCheckpoint(projectUuid: string, checkpoint: EditorCheckpoint): void
export function readCheckpoint(projectUuid: string): EditorCheckpoint | null
export function clearCheckpoint(projectUuid: string): void
```

- [ ] Write tests for undo/redo, capped history, redo clearing after a new edit, corrupt storage, schema rejection, and revision mismatch.
- [ ] Implement immutable snapshot history capped at 50 entries and a `badge-layout.draft.v1.<projectUuid>` storage key validated by `badgeLayoutSchema`.
- [ ] Verify with `npx.cmd jest src/__tests__/lib/badge-layout/editor-draft.test.ts --runInBand`.

### Task 2: Editor recovery, history controls and friendly common actions

**Files:**
- Modify: `src/components/settings/badge-layout-editor.tsx`
- Modify: `src/lib/badge-layout/geometry.ts`
- Test: `src/__tests__/lib/badge-layout/editor.test.tsx`

- [ ] Add a checkpoint restore/discard prompt only when its base revision equals the fetched draft revision. Clear it after save/publish/discard; preserve it after errors.
- [ ] Route all layout replacement through one `applyLayout(next, action)` function. Coalesce pointer moves into one history entry at release; wire Undo/Redo buttons and Ctrl/Cmd shortcuts, excluding editable elements.
- [ ] Replace property labels with operational copy; add horizontally/vertically/paper-centre actions and reset selected field to its project starter frame. Place line height, letter spacing, transform and fit mode in `Advanced text settings`.
- [ ] Add tests for recovery compatibility, undo keyboard input exclusions, drag coalescing, redo invalidation, and quick actions.
- [ ] Verify with `npx.cmd jest src/__tests__/lib/badge-layout/editor.test.tsx src/__tests__/lib/badge-layout/editor-draft.test.ts --runInBand`.

### Task 3: In-product verification wording and release evidence

**Files:**
- Modify: `src/components/settings/badge-layout-editor.tsx`
- Modify: `src/components/print/printer-calibration.tsx` in the onsite repository
- Modify: `docs/badge-layout-acceptance.md`
- Test: `src/__tests__/lib/badge-layout/editor.test.tsx`

- [ ] Add a visible pre-publish checklist: valid geometry, test print of current snapshot, paper size, 100% scale, zero margins, headers/footers off, and a calibration link.
- [ ] Clarify in calibration UI that uniform displacement uses offsets; a size mismatch must be corrected in browser/driver settings.
- [ ] Record exact commands and remaining physical gates in acceptance documentation. No check becomes "passed" without evidence.
- [ ] Run focused Jest, onsite Vitest, both production builds, backend Go tests/vet, and fixture SHA256 comparison.

### Task 4: Review and handoff

**Files:**
- Modify: `docs/badge-layout-acceptance.md`

- [ ] Run `git diff --check` in all three repositories and preserve unrelated files.
- [ ] Record test counts/build results, skipped disposable DB test reason, and physical printer sign-off steps.
- [ ] Commit only task files after user review; do not stage unrelated onsite documentation.
