# Event Daily Attendance Design

## Goal

Show each event's daily local and overseas attendance inside the existing
Event Overview section on both Admin and Organizer dashboards.

## Data Contract

Extend each existing `event_summaries` item with:

```json
{
  "daily_attendance": [
    {
      "date": "2026-09-02",
      "local": 0,
      "oversea": 0
    }
  ]
}
```

The backend already supplies this field. The frontend will add the matching
TypeScript type as optional during staggered deployment and consume it without
another API request.

## UI

Keep the current event name, status, and total metrics. Add a native
`details`/`summary` disclosure below them inside each event card. It is closed
by default, its summary is styled as a button, and its label changes between
`Show attendance` and `Hide attendance`.

Inside the disclosure, show a compact table with these columns:

- `Date`
- `Local`
- `Oversea`

Render one row per `daily_attendance` entry in API order. Keep the API date
string unchanged to avoid timezone-dependent date shifts, and format attendance
counts with `toLocaleString()`.

When an event has no attendance entries, show `No attendance data` in place of
table rows.

Use the existing shared `EventSummaryCards` component so the change appears on
both Admin and Organizer dashboards. Use the project's existing table
primitives and add no dependency or new component abstraction.

Use the native disclosure element instead of React state so the shared
component remains server-compatible and keyboard-accessible.

## Error Handling

Preserve the existing Event Overview unavailable and no-events states. Define
`daily_attendance` as optional and render from `event.daily_attendance ?? []`
inside `EventSummaryCards`, so a missing field is treated as an empty list
during staggered frontend/backend deployments.

## Testing

Focused frontend tests verify:

- Multiple daily attendance rows render under their event.
- Local and overseas counts use locale number formatting.
- Missing or empty attendance data renders `No attendance data`.
- Two attendance disclosures start closed; opening one leaves the other
  closed, changes its label to `Hide attendance`, and activating it again
  closes only that disclosure.
- Existing active/inactive, no-events, and unavailable states remain intact.

## Files

- `src/app/actions/dashboard.ts`
- `src/components/dashboard/event-summary-cards.tsx`
- `src/__tests__/actions/dashboard.test.ts`
- `src/__tests__/components/dashboard/event-summary-cards.test.tsx`

## Out of Scope

- Backend changes.
- Sorting, filtering, pagination, charts, totals, or expandable rows.
- Date localization.

## Acceptance Criteria

- Every event card displays its daily attendance table.
- Every attendance table is hidden by default and can be shown or hidden
  independently.
- Each API attendance item displays the correct date, local count, and overseas
  count.
- Both Admin and Organizer dashboards receive the change through the shared
  component.
- Missing attendance data does not break the dashboard.
