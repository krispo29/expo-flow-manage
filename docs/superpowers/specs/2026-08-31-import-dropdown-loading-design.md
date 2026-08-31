# Import Dropdown Loading Design

## Goal

Make the dropdowns on `/admin/imports` distinguish an in-progress data request from a completed request with no available options.

## Scope

The Imports page loads events, exhibitors, attendee types, and staff types in parallel after the page renders. Until each request completes, the related dropdown must be non-interactive and show its loading state directly on the closed trigger. Once its request completes, the existing empty-state copy remains responsible for reporting a genuine empty list.

Affected selectors:

- Event: exhibitors, registrations, conferences, and invitation codes.
- Exhibitor: exhibitor members.
- Attendee type: registrations.
- Staff type: staff imports.

## Design

`ImportsContent` will track completion for each of the four option datasets independently. The requests still start together, but each one settles its own loading state in a `finally` block rather than waiting for the shared `Promise.all` to resolve. A request failure is also a completed load: the selector is re-enabled and continues to show the existing empty copy, preserving the page's current failure behavior.

`Combobox` gains an optional `loading` property. When true, it disables the trigger and replaces its closed trigger label with a spinner and `Loading…`; users receive feedback despite the disabled popover being unavailable. The component continues to accept `disabled` for callers that need a separately disabled control; its effective disabled value is `disabled || loading`.

The page passes each independent loading value to its corresponding selector. The invitation-code dropdown still contains its local `No Event` item, but stays unavailable until events finish loading so its event list does not look complete while the request is in flight.

## Testing

Add focused Combobox tests confirming that loading renders the loading copy on the trigger, disables it, and that an empty completed list still renders the supplied empty message after opening the selector. Run the focused test and the project type/build check.

## Constraints

- Do not add dependencies or change server actions/API contracts.
- Do not modify import validation or submission behavior.
- Reuse the existing `Loader2` icon and current component styling.
