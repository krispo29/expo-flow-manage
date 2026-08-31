# Import Dropdown Loading Design

## Goal

Make the dropdowns on `/admin/imports` distinguish an in-progress data request from a completed request with no available options.

## Scope

The Imports page loads events, exhibitors, attendee types, and staff types in parallel after the page renders. Until each request completes, the related dropdown must be non-interactive and its menu must communicate that its options are loading. Once its request completes, the existing empty-state copy remains responsible for reporting a genuine empty list.

Affected selectors:

- Event: exhibitors, registrations, conferences, and invitation codes.
- Exhibitor: exhibitor members.
- Attendee type: registrations.
- Staff type: staff imports.

## Design

`ImportsContent` will track completion for each of the four option datasets independently. A request failure is also a completed load: the selector is re-enabled and continues to show the existing empty copy, preserving the page's current failure behavior.

`Combobox` gains an optional `loading` property. When true, it disables the trigger and replaces the command empty state with a spinner and `Loading…`. The component continues to accept `disabled` for callers that need a separately disabled control; its effective disabled value is `disabled || loading`.

The page passes each independent loading value to its corresponding selector. The invitation-code dropdown still contains its local `No Event` item, but stays unavailable until events finish loading so its event list does not look complete while the request is in flight.

## Testing

Add focused Combobox tests confirming that loading renders the loading copy rather than the empty message, disables the trigger, and that an empty completed list still renders the supplied empty message. Run the focused test and the project type/build check.

## Constraints

- Do not add dependencies or change server actions/API contracts.
- Do not modify import validation or submission behavior.
- Reuse the existing `Loader2` icon and current component styling.
