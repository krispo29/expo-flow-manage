# Invitation Event Scope

## Goal

Add optional event scoping to Admin and Organizer invitation workflows while preserving project-wide behavior when no event is selected. Admin create, update, and import operations may explicitly assign an invitation to an event or submit an empty `event_uuid`.

## API Integration

### Admin invitation list

- `GET /v1/admin/project/invitations`
- Accepts optional query parameter `event_uuid`.
- When an event is selected, send `params: { event_uuid }`.
- When no event is selected, omit `event_uuid` so the backend returns invitations across all events.

### Admin invitation export

- `GET /v1/admin/project/invitations/export-excel`
- Uses the same optional `event_uuid` selection as the invitation list.
- Omit the query parameter when exporting all events.

### Admin invitation create

- `POST /v1/admin/project/invitations`
- Add `event_uuid` to the request body.
- Event selection is optional.
- When no event is selected, send `event_uuid: ""`.

### Admin invitation update

- `PUT /v1/admin/project/invitations`
- Add `event_uuid` to the request body alongside the existing invitation fields.
- Event selection is optional.
- When no event is selected, send `event_uuid: ""`.

### Admin invitation import

- `POST /v1/admin/project/import/invite-codes`
- Add `event_uuid` to the multipart form data.
- Event selection is optional.
- When no event is selected, append `event_uuid` with an empty string.

### Organizer invitation list

- `GET /v1/organizer/invitations`
- Accepts optional query parameter `event_uuid`.
- Preserve existing organizer project authentication headers.
- When no event is selected, omit `event_uuid`.

### Organizer invitation export

- `GET /v1/organizer/invitations/export-excel`
- Replace the current Admin export endpoint used by the Organizer action.
- Accept the same optional `event_uuid` selection as the Organizer invitation list.
- When no event is selected, omit `event_uuid`.

## Invitation Page

The Admin and Organizer pages continue to share the invitation list and export components.

Add a page-level event selector with:

- `All Events` as the default option.
- Active project events as selectable options.
- A single selected value shared by list loading and export.
- A list refresh and pagination reset whenever the selection changes.

Both the Admin and Organizer invitation pages load event options from `GET /v1/admin/project/events`. The request uses the selected page `projectId` as the `X-Project-UUID` header. The Organizer invitation page must not fall back to `/v1/organizer/project/events`; this endpoint rule is scoped to the invitation-code workflow and does not change conference or exhibitor event loading. Event-loading failures leave `All Events` available and show an error toast without blocking the invitation list.

The export component receives the selected event UUID from the page instead of managing an independent selection. This ensures the exported file matches the scope currently shown in the list.

## Admin Create And Update

Add an optional Event field to both dialogs:

- Include a `No Event` option represented by a non-empty UI sentinel because the existing Select primitive does not support an empty option value.
- Create starts with no event selected.
- Update initializes from the invitation's `event_uuid`, falling back to the `No Event` sentinel.
- Normalize the sentinel to `event_uuid: ""` when submitting either dialog.
- Submitting either dialog always includes `event_uuid`, including when it is empty after normalization.
- Reset the create dialog's event value after a successful submission.

Extend the `Invitation` interface with optional event metadata required by the UI:

- `event_uuid?: string`
- `event_name?: string`

When event metadata is returned, show the event name in the invitation list. Invitations without an event display `No Event`. If only `event_uuid` is available, resolve the name from the loaded event options and fall back to the raw UUID.

## Admin Import

Add an Event selector to the Import Invitation Codes card:

- Reuse the event list already loaded by the Imports page.
- Include `No Event` using the same non-empty UI sentinel and default to it.
- Do not block import when the selection is empty.
- Normalize the sentinel and always append `event_uuid` to the multipart form before calling `importInviteCodes`.
- Keep the selected event after a successful import so repeated imports retain the operator's scope.

Other import types retain their existing required-event behavior.

## State And Error Handling

- Changing projects resets the selected event to `All Events` and reloads events and invitations.
- Changing the invitation event filter resets client pagination to page one.
- Existing search and status filters remain client-side and operate on the event-scoped response.
- Empty event values are normalized to `""` for create, update, and import payloads.
- Empty event values are normalized to omission for list and export query parameters.
- Existing API error handling and toast behavior remain in place.

## Code Boundaries

- Update Admin invitation types and actions in `src/app/actions/settings.ts`.
- Update Organizer list and export actions in `src/app/actions/organizer-invitation.ts`.
- Update the shared invitation list and Admin dialogs in `src/components/settings/invitation-codes.tsx`.
- Update export parameter forwarding in `src/components/invitation-excel.tsx`.
- Coordinate event selection in the Admin and Organizer invitation page components.
- Update the Invitation Codes import card in `src/app/admin/(dashboard)/imports/page.tsx`.
- Keep unrelated invitation link, search, pagination, and import-history behavior unchanged.

## Verification

- Admin list includes `event_uuid` only when an event is selected.
- Admin export includes `event_uuid` only when an event is selected.
- Admin create and update always include `event_uuid`, including an empty string.
- Admin invite-code import appends `event_uuid`, including an empty string.
- Organizer list includes `event_uuid` only when an event is selected.
- Organizer export uses `/v1/organizer/invitations/export-excel` and applies the optional event query.
- Admin and Organizer invitation event selectors both load from `GET /v1/admin/project/events`.
- Organizer invitation event loading does not call `/v1/organizer/project/events` as a fallback.
- Event loading sends the current page `projectId` as `X-Project-UUID`.
- UI tests cover selector changes, payload forwarding, and empty-event submissions where practical.
- Run targeted Jest tests, TypeScript validation, and the production build.
- Verify Admin and Organizer invitation pages plus the Admin import card in the in-app browser.
