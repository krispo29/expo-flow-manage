# Central Badge Layout Designer Design

## Summary

Replace project-specific badge CSS adjustments with a central field-based visual editor. An authorized organizer or administrator configures one active badge layout per project in `expo-flow-manage`, tests it as a draft, and publishes it for both `expo-flow-manage` and `expo-flow-manage-onsite` to consume.

The first release supports only the seven fields already printed today: full name, position, company, country, QR code, registration code, and badge type. Each project starts from the existing Default, ILDEX PH/Indonesia, or THAILAB geometry. The saved layout uses physical units and is independent of `project_code` after initialization.

## Goals

- Let non-developers set paper width and height and arrange existing badge fields without CSS changes or deployments.
- Preserve the currently approved output for Default, `ILDEXPH2026`/`INDO2026`, and `THAILAB2026` as editor starter templates and legacy production fallbacks.
- Give users a safe Draft -> Test Print -> Publish workflow.
- Make central-admin printing and onsite printing consume the same published layout contract.
- Keep onsite printing available when the configuration API is temporarily unavailable.
- Separate project layout geometry from printer-specific physical calibration.
- Leave a low-cost migration path to multiple layouts per project without implementing multiple layouts now.

## Non-goals

- Multiple active layouts per project or attendee-type-specific layouts.
- Arbitrary static text, uploaded print images, HTML, CSS, or user-defined data fields.
- Rotation, multi-selection, z-index editing, or unrestricted layer composition.
- Printing the reference artwork.
- Remotely controlling browser print-dialog or printer-driver settings.
- Removing the existing hardcoded renderers in the first rollout. They remain temporary fallbacks until all active projects pass physical-print acceptance.

## Existing System and Problem

`expo-flow-manage` already persists a partial `project.settings.badge` object containing a background image URL, page size, and three vertical section heights. Its print code does not consume those settings; it selects hardcoded Default or THAILAB CSS. Some print callers also pass a project UUID into an argument used as a project code, which only works for THAILAB because its UUID is explicitly recognized.

`expo-flow-manage-onsite` has separate hardcoded Default, ILDEX PH/Indonesia, and THAILAB components. Recent changes repeatedly adjust individual CSS measurements and font-fit behavior. The onsite session contains `projectCode` and `projectUuid`, but the frontend has no discovered endpoint for retrieving the project's badge settings.

The result is duplicated rendering logic and a developer deployment for every physical layout adjustment.

## Chosen Approach

Build a field-based visual editor around a strict, versioned JSON schema. Fields are absolutely positioned in millimetres within a paper rectangle; text sizes are expressed in points. The backend owns draft and published state. Both frontends validate and render the published schema, while the central editor can render its unsaved or saved draft for preview and test printing.

Use native Pointer Events, keyboard events, and CSS transforms for editing. Do not add a page-builder or drag-and-drop dependency.

## Layout Contract

### Envelope

```ts
type BadgeLayoutState = {
  draft: BadgeLayout | null
  draftRevision: number
  published: BadgeLayout | null
  publishedRevision: number
  publishedAt: string | null
  publishedBy: {
    id: string
    displayName: string
  } | null
}
```

Draft and published revisions are independent monotonically increasing integers. Saving a draft increments `draftRevision`. Publishing atomically copies the current draft into a new immutable published revision, increments `publishedRevision`, and records the actor and timestamp.

### Layout

```ts
type BadgeFieldKey =
  | "fullName"
  | "position"
  | "company"
  | "country"
  | "qrCode"
  | "registrationCode"
  | "badgeType"

type BadgeLayout = {
  schemaVersion: 1
  layoutId: "default"
  paper: {
    widthMm: number
    heightMm: number
  }
  referenceBackgroundUrl: string | null
  fields: {
    fullName: TextFieldLayout
    position: TextFieldLayout
    company: TextFieldLayout
    country: TextFieldLayout
    qrCode: QrFieldLayout
    registrationCode: TextFieldLayout
    badgeType: TextFieldLayout
  }
}

type FieldFrame = {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  visible: boolean
}

type TextFieldLayout = FieldFrame & {
  kind: "text"
  fontSizePt: number
  minFontSizePt: number
  fontWeight: 400 | 700 | 900
  lineHeight: number
  letterSpacingPt: number
  textAlign: "left" | "center" | "right"
  textTransform: "none" | "uppercase"
  maxLines: 1 | 2
  fitMode: "shrink-then-clip" | "clip"
}

type QrFieldLayout = FieldFrame & {
  kind: "qr"
  errorCorrection: "M"
}
```

Coordinates are measured from the paper's top-left corner. `xMm + widthMm` and `yMm + heightMm` must remain inside the paper. QR width and height must be equal. Version 1 accepts exactly the seven whitelisted keys and one `layoutId`, `default`. A later schema may wrap layouts in a collection and choose an active ID without changing the meaning of the version-1 layout.

`lineHeight` is a unitless multiplier and `letterSpacingPt` is measured in points. Together they let starter fixtures reproduce current field-specific typography without undocumented CSS. `referenceBackgroundUrl` is either an absolute URL or `null` when no artwork is configured. It is editor metadata; print renderers must neither put it in the print DOM nor use it in print CSS.

### Render Data

Both frontends normalize their existing participant/staff records into this boundary before rendering:

```ts
type BadgeRenderData = {
  fullName: string
  position: string
  company: string
  country: string
  registrationCode: string
  badgeType: string
}
```

The QR field encodes `registrationCode`. A missing registration code remains a blocking print error. Empty non-QR text fields remain valid and retain their configured frames so other fields do not shift.

## Starter Templates and Migration

Version-1 starter fixtures encode the exact current physical geometry and typography for:

- Default
- ILDEX PH/Indonesia for `ILDEXPH2026` and `INDO2026`
- THAILAB for `THAILAB2026`

When the admin API returns no draft, the editor chooses a starter from the normalized `project_code` and initializes an unsaved local draft. Unknown codes use Default. Resetting also replaces the local draft with that project's starter but does not save or publish until the user explicitly acts.

Until a project has a valid published version, production printing uses its existing legacy project renderer. Project-specific CSS remains available only as a migration fallback; new projects and future layout changes must not add new project-code branches.

Existing country display normalization, including THAILAB's Taiwan label, happens while producing `BadgeRenderData`, not in geometry configuration.

## Backend API Contract

The implementation must expose targeted endpoints instead of updating the complete project settings document. Storage may remain in the existing project settings JSON initially, provided updates are atomic at the badge-layout path and retain published revision history.

### Admin

```text
GET  /v1/admin/project/badge-layout
GET  /v1/admin/project/badge-layout/revisions
PUT  /v1/admin/project/badge-layout/draft
POST /v1/admin/project/badge-layout/publish
POST /v1/admin/project/badge-layout/rollback
```

Admin requests use the existing authorization and `X-Project-UUID` context.

`GET` returns `BadgeLayoutState` or a state with null draft/published values when uninitialized.

`PUT /draft` accepts:

```ts
type SaveBadgeLayoutDraftRequest = {
  expectedDraftRevision: number
  layout: BadgeLayout
}
```

It validates the complete layout and returns the updated state. A revision mismatch returns HTTP 409 and the current state without overwriting it.

`POST /publish` accepts the expected draft revision. The backend revalidates the draft and atomically appends an immutable published revision. It returns the updated state. Publishing is rejected if there is no draft or its revision differs.

`GET /revisions` returns published revision metadata newest-first so the admin can present rollback choices:

```ts
type BadgeLayoutRevisionSummary = {
  publishedRevision: number
  publishedAt: string
  publishedBy: {
    id: string
    displayName: string
  }
}
```

The first release returns the latest 20 revisions. The current published revision is included. Layout bodies are not required in this listing because rollback and the main editor only need a target revision and the current layout.

`POST /rollback` accepts a previous `publishedRevision`. The backend copies that historical layout into a new published revision; it never rewrites history.

### Onsite

```text
GET /v1/onsite/project/badge-layout
```

The onsite access token determines the project. The endpoint returns only the current published layout and its revision; it never returns a draft or another project's configuration.

### Permissions and Validation

Only roles already authorized to update project settings may save, publish, or roll back. Read-only staff cannot open editing actions. Onsite staff have read-only access to the published layout for their session project.

The backend rejects:

- unsupported schema versions or layout IDs;
- missing, extra, or duplicate field keys;
- non-finite values and values outside defined paper, coordinate, dimension, font, and line-count ranges;
- field frames outside the paper;
- non-square or undersized QR frames;
- unsupported font weights, transforms, alignments, fit modes, or QR error correction;
- non-null reference URLs that do not satisfy the application's existing image-URL policy.

Field overlap is allowed because it may be intentional. The editor reports it as a warning.

The exact safe numeric limits must be constants shared by each frontend's validator and copied into the backend contract tests. Initial limits are:

- paper width and height: `20mm` through `500mm`;
- coordinates: `0mm` through the applicable paper edge;
- text field width and height: at least `1mm`;
- QR side: `15mm` through the smaller paper dimension;
- font sizes: `4pt` through `120pt`, with `minFontSizePt <= fontSizePt`.
- unitless line height: `0.5` through `3`;
- letter spacing: `-5pt` through `20pt`.

## Central Admin UX

Badge Designer is a dedicated settings page/component rather than another block in the existing large General Settings component.

### Layout

- Left panel: seven fixed fields with visibility toggles and selection.
- Center: scaled paper canvas with optional reference artwork, grid, ruler, selection frame, resize handles, snap guides, and warnings.
- Right panel: numeric geometry and text properties for the selected field.
- Toolbar: paper dimensions, zoom, grid/snap toggles, normal/long sample switch, reset, Save Draft, Test Print, Publish, and published status.

### Editing Behavior

- Dragging changes `xMm` and `yMm`; resize handles change dimensions.
- Snapping targets paper edges, paper centres, other field edges/centres, and the visible grid.
- Arrow keys move a selected field by `0.5mm`; Shift+Arrow moves it by `5mm`.
- Numeric X, Y, width, and height inputs support exact entry.
- Resizing a QR maintains a square aspect ratio.
- Zoom affects only screen rendering, never saved geometry.
- Reset asks for confirmation, replaces the local draft with the project starter, and marks it unsaved.
- Leaving with unsaved changes invokes the browser's unsaved-change protection.
- Pointer and keyboard editing update the same state transition functions so they cannot diverge.

Text controls expose maximum/minimum font size, weight, line height, letter spacing, alignment, transformation, maximum lines, and fit mode. Version 1 uses the application's existing print font and does not allow arbitrary font loading.

### Preview and Validation

Normal preview uses representative values. Long-data preview uses deliberately long name, position, and company values. Both are deterministic fixtures so changes are comparable.

The editor displays immediate errors for invalid geometry, out-of-paper fields, an undersized QR, and text that cannot fit under the selected policy. It displays overlap as a warning. Drafts may be saved with warnings, but Publish is disabled for validation errors that make a layout unusable.

Status clearly distinguishes Unsaved, Draft saved, and Published revision N. Publish and rollback require confirmation and show actor/time on completion.

Test Print renders the current local draft, including unsaved changes, through the same print renderer as production. It never prints the reference artwork, selection UI, grids, rulers, or warnings.

## Rendering

Each frontend implements a small renderer against the same contract and contract fixtures. Separate repositories do not share runtime source code, so schema fixtures and renderer behavior tests are the compatibility boundary.

The renderer uses a relatively positioned paper element and absolutely positioned children in `mm`. Text uses `pt`. Dynamic `@page` CSS uses the layout's width and height with zero margins. Each badge is one print page.

Text fitting measures rendered content and reduces from `fontSizePt` to `minFontSizePt` when `fitMode` is `shrink-then-clip`. It then clips according to `maxLines`; it never moves sibling fields. `clip` skips shrinking. QR generation remains inline SVG in both frontends and must not call an external QR image service.

Preview mode may render the reference artwork and editing chrome. Print mode has a white background and renders only participant data.

The admin's existing print entry points must resolve actual project context and published layout instead of treating a UUID as a project code. The onsite renderer receives a validated layout snapshot as part of each local print job.

Central-admin production printing follows the same activation rule as onsite: it uses a valid published layout, and uses the existing legacy project renderer when the project is uninitialized or published-layout retrieval fails. Test Print is the only path allowed to render a draft.

## Onsite Retrieval, Caching, and Deterministic Jobs

Publishing the first valid layout is the per-project activation gate for the schema renderer. Onsite resolves a renderer and layout in this order:

1. valid current published layout returned by the onsite API;
2. valid cached published layout for the normalized project code;
3. existing legacy project renderer when the project has never published, or when no valid current/cached published layout is available.

A successful API response is validated and cached in browser local storage under a schema-versioned, project-scoped key. Corrupt, wrong-project, unsupported-version, or malformed cached values are discarded. Drafts are never cached by onsite.

The API distinguishes an uninitialized project (`published: null`) from a request failure. An uninitialized project deliberately stays on its legacy renderer. A project that has published at least once may use its validated cache during a request failure. Clearing published history is not supported, so a project cannot accidentally revert to an uninitialized state.

Layout retrieval occurs before persisting/opening the print job. The selected layout is embedded as a snapshot beside the badge data in the existing local print-job payload. All pages in a bulk job therefore use the same layout even if a new revision is published while the print dialog is open.

If layout retrieval fails, printing continues from cache or the legacy renderer and writes a structured diagnostic containing project code, selected source (`api`, `cache`, or `legacy`), cached/published revision when known, and failure reason. It uses the application's existing error reporter when available and otherwise `console.warn`; this feature does not add an analytics dependency. Existing missing-job, popup, cleanup, and after-print behavior remains unchanged.

## Workstation Calibration

Published project geometry must not be edited to compensate for one printer. Onsite stores a project-scoped workstation calibration separately:

```ts
type WorkstationPrintCalibration = {
  offsetXMm: number
  offsetYMm: number
}
```

Both values default to zero and are constrained to `-20mm` through `20mm`. They are stored only in the local browser and applied as a translation to the complete print page. They are not sent to the backend and are not included in published layouts.

The onsite UI provides a calibration test that prints crosshairs/rulers and allows exact X/Y adjustment. It also displays the required driver checklist: scale 100%, margins none, headers/footers off, and paper size matching the published layout. The application cannot guarantee or set driver options automatically.

## Failure Behavior

- Admin configuration API failure preserves unsaved local state and offers retry.
- Draft revision conflict shows that a newer server draft exists and requires reload; it never silently overwrites.
- Invalid draft responses, published responses, and caches are never rendered.
- Unsupported schema versions use a valid cache or the legacy renderer and report diagnostics.
- Missing registration code blocks printing as it does today.
- Empty optional text renders an empty fixed frame.
- Onsite configuration failure does not block printing when a cache or legacy renderer is available.
- A published layout remains immutable; rollback creates a new revision.

## Testing

### Shared Contract Expectations

Both frontend repositories and the backend must test the same committed version-1 JSON fixtures:

- one valid fixture for each starter template;
- long and empty render data;
- invalid out-of-bounds field;
- invalid QR geometry;
- unknown schema version;
- malformed numeric values.

### `expo-flow-manage`

- Schema parsing and every validation boundary.
- Starter selection and reset behavior.
- Drag, resize, snap, keyboard nudge, and numeric input transitions.
- Reference artwork appears in preview but never in print markup/styles.
- Draft save, conflict, publish, confirmation, rollback, and unsaved navigation behavior.
- Dynamic paper dimensions and text fitting.
- Existing single/bulk/staff print paths use published project context and inline QR.

### `expo-flow-manage-onsite`

- API -> cache -> legacy resolution order, including the difference between an uninitialized project and a request failure.
- Cache project/version validation and corrupt-cache removal.
- Print-job persistence includes one immutable layout snapshot.
- Bulk jobs render every page with the same snapshot.
- Workstation offsets are local and are applied without changing the project layout.
- Missing, expired, popup, after-print, and cleanup behavior remains intact.
- Existing Default, ILDEX PH/Indonesia, and THAILAB output remains equivalent before a layout is published.

### Backend

- Project isolation and role permissions.
- Complete server-side validation.
- Optimistic concurrency conflict.
- Atomic publish and immutable history.
- Rollback creates a new revision.
- Onsite endpoint never leaks drafts or cross-project layouts.

### Physical Acceptance

For every active project:

- compare its starter output to the current approved output;
- print at least one badge on the actual onsite printer and media;
- measure page and calibration marks;
- exercise normal, long, and empty field values;
- print multiple pages;
- verify cached printing after configuration-network failure;
- publish during a prepared bulk job and confirm every page retains the original snapshot.

## Rollout

1. Implement backend storage, validation, admin endpoints, onsite endpoint, and revision history.
2. Deploy Badge Designer while production printing still ignores published layouts.
3. Initialize and test drafts for active projects without publishing them.
4. Deploy the shared-schema renderer to `expo-flow-manage`; projects without a published layout remain on their legacy renderer.
5. Deploy layout retrieval, snapshot rendering, caching, and calibration to `expo-flow-manage-onsite`; projects without a published layout remain on their legacy renderer.
6. Physically accept and then publish one project at a time. Its first Publish atomically switches that project to the schema renderer in both frontends.
7. Retain legacy hardcoded renderers as fallback until every active project is accepted.
8. Remove legacy project-specific CSS in a later cleanup after every active project is published and its rollback/incident window has elapsed.

The implementation should be planned as coordinated units for backend, central admin, and onsite because they live in separate repositories and can deploy independently. The backend repository and its exact file paths must be supplied before writing its file-level implementation plan.

## Success Criteria

- An authorized non-developer can adjust paper geometry and all seven fields, test-print a draft, and publish without a code change.
- Draft edits cannot affect production printing before Publish.
- Both frontends render the same published geometry for the same data.
- Reference artwork never prints.
- Onsite printing survives configuration API failure through a validated cache or legacy renderer.
- A printer-specific offset does not alter the centrally published project layout.
- Existing active projects can migrate without changing their approved badge output.
