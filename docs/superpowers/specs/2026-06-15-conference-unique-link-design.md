# Conference Unique Link Design

## Goal

Expose the `unique_link` returned by the Get All Conferences APIs on the
conference list used by Admin and Organizer, with a one-click copy action.

## Design

- Add an optional `unique_link` field to the shared `Conference` interface.
- Render a "Registration Link" row on each conference card when the field is
  present and non-empty.
- Show a truncated URL in the card so long links do not expand the layout.
- Add a Copy button that copies the complete URL using the existing
  `copyTextToClipboard` helper.
- Report copy success or failure through the existing Sonner toast pattern.
- Keep the shared implementation in `ConferenceList`, which is already used by
  both Admin and Organizer conference pages.

## Data Flow

The Admin and Organizer server actions pass the API response through as
`Conference[]`. The client list reads `conference.unique_link` directly, shows
the row when available, and sends the full string to the clipboard helper when
the user clicks Copy.

## Error Handling

- Do not render the row when `unique_link` is absent or blank.
- Show an error toast when clipboard access fails.
- Do not modify or synthesize the URL returned by the API.

## Verification

- Confirm TypeScript accepts `unique_link` on conference responses.
- Add focused component coverage for visible, hidden, successful copy, and
  failed copy behavior if the existing test setup supports this component.
- Run the relevant tests, lint, and TypeScript checks available in the project.
- Verify the card layout at desktop and narrow viewport widths.
