# Event Overview Attendance Labels Design

## Scope

Change only the visible labels of the daily-attendance disclosure in the shared
Event Overview dashboard component. The component is used by both Admin and
Organizer dashboards.

## Behaviour

- When the disclosure is closed, its label is `On show Attendance`.
- When the disclosure is open, its label is `On Hide Attendance`.
- The native `details` and `summary` toggle behavior, layout, data, and
availability conditions remain unchanged.

## Implementation and Verification

Update the two text nodes in `src/components/dashboard/event-summary-cards.tsx`
and adjust the existing component test assertions to the exact new labels. Run
the focused Jest file and production build.
