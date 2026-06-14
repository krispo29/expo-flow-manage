# Questionnaire-Triggered Attendee Type Upgrade

## Goal

Add an admin review queue for attendee type upgrade requests created by questionnaire answers. Admins can inspect why an upgrade was suggested, approve it using a selected attendee type, or reject it with an optional note.

## API Integration

### List requests

- `GET /v1/admin/project/upgrade-requests`
- Requires `Authorization` and `X-Project-UUID`.
- The response includes request, registration, questionnaire trigger, attendee identity, current type, suggested type, approved type, status, review metadata, and timestamps.

### Attendee types

- `GET /v1/admin/project/participants/attendee_types`
- Used as the source of truth for type labels and approval choices.
- Types are sorted by `order_index`.

### Review request

- `POST /v1/admin/project/upgrade-requests/review`
- Requires `request_uuid`.
- The action must send the backend-confirmed decision field, selected approved type for approval, and optional note.
- The UI defaults the approved type to `suggested_type_code` but allows the admin to select another API-provided type.

## Page Structure

Create `/admin/upgrade-requests`.

The page uses a mobile-first review queue:

1. Header with title and a short explanation.
2. Summary cards for pending, approved, rejected, and approval rate.
3. Status tabs: Pending, Approved, Rejected, All. Pending is the default.
4. Search across attendee name, email, company, and registration code.
5. Request cards showing:
   - Attendee identity and registration code
   - Created/reviewed time
   - Current type and suggested/approved type
   - Triggering questionnaire question and selected answer
   - Status and review note
   - Approve and Reject actions for pending requests

Cards remain the primary layout on desktop and mobile. Desktop uses a responsive two-column grid where space permits; mobile uses one column with full-width, minimum 44px action targets.

## Review Flow

### Approve

1. Open a confirmation dialog.
2. Preselect `suggested_type_code`.
3. Populate choices from the attendee-types endpoint.
4. Show the current-to-selected type transition.
5. Submit the request once and disable both actions while pending.
6. Refresh the queue after success.

### Reject

1. Open a destructive confirmation dialog.
2. Accept an optional review note.
3. Submit once and refresh after success.

Already reviewed requests are read-only. Their cards show review result, reviewer metadata when available, and note.

## States And Accessibility

- Loading: skeleton summary and queue cards.
- Empty: status-specific message rather than a generic cleared state.
- Error: visible retry action and toast.
- Missing project: prompt the user to select a project.
- Unknown attendee type: fall back to the raw code.
- Keyboard-accessible dialogs and controls through existing shadcn primitives.
- Status is communicated through text and icon, not color alone.
- Dialog focus, labels, descriptions, and destructive semantics remain explicit.

## Code Boundaries

- Add upgrade request types and server actions in a focused action module.
- Keep filtering and display helpers in a small testable utility module.
- Add the page and client review queue component.
- Add Admin-only sidebar, breadcrumb, and command palette navigation.
- Reuse existing API client, auth headers, cards, badges, dialogs, selects, tabs, skeletons, and toast system.
- Do not refactor the existing quota request page.

## Verification

- Unit-test type lookup, status filtering, search matching, approval defaults, and payload construction.
- Run the targeted Jest tests, TypeScript/build validation, and production build.
- Verify desktop and mobile layouts in the in-app browser.
- Verify loading, empty, populated, approve dialog, reject dialog, and disabled action states without submitting a real review.
