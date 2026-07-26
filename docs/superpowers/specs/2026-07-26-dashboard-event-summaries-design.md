# Dashboard Event Summaries Design

## Goal

Add per-event participant, exhibitor, and conference totals to the Admin and
Organizer dashboards while preserving the existing project-level totals.

## Repositories

- Frontend: `C:\Users\Mike\Desktop\Works\expo-flow-manage`
- Backend: `D:\Works\expoflow-service`

## API Contract

Extend the existing `GET /v1/admin/project/dashboard` response with a top-level
`event_summaries` array:

```json
{
  "event_summaries": [
    {
      "event_uuid": "uuid",
      "event_code": "EVENT_A",
      "event_name": "Event A",
      "is_active": true,
      "total_participants": 200,
      "total_exhibitors": 90,
      "total_conferences": 20
    }
  ]
}
```

Both dashboards continue using this shared endpoint and frontend action. No
Organizer-specific endpoint is added.

## Backend Design

Add an event-domain dashboard summary model and a repository/service method
that returns all non-deleted events for the selected project. Use one database
query with per-event counts so the handler does not issue requests in a loop.

Counting must match the existing project totals:

- Participants count registrations with the same `project_uuid` and
  `event_uuid` where `deleted_at IS NULL`.
- Exhibitors count exhibitors with the same `project_uuid` and `event_uuid`
  where `deleted_at IS NULL`.
- Conferences count conferences with the same `project_uuid` and `event_uuid`
  where `status != cancelled`.
- Include active and inactive events.
- Exclude soft-deleted events.
- Return zero for an event with no matching records.
- Order events by `order_index ASC`.

The Admin dashboard handler adds the resulting list to `DashboardResponse`.
If the event-summary query fails, return an internal-server error instead of
returning potentially misleading zero values.

## Frontend Design

Extend the shared dashboard types and fallback mapping with
`event_summaries`. During a staggered deployment, a response without this field
maps to an empty array.

Add one shared `EventSummaryCards` component under
`src/components/dashboard/` and render it from both:

- `src/app/admin/(dashboard)/page.tsx`
- `src/app/organizer/(dashboard)/page.tsx`

Place the section directly below the existing project total cards. The existing
project cards and their meaning remain unchanged.

## UI Behavior

- Section title: `Event Overview`.
- Use the existing Card and Badge primitives.
- Display two event cards per row on desktop and one per row on mobile.
- Each card shows event name, event code, Active/Inactive status, and the three
  totals.
- Format totals with `toLocaleString()`.
- Show inactive events with a clear `Inactive` badge.
- If the array is empty, show `No events available`.

## Testing

Backend coverage verifies:

- Active and inactive events are returned.
- Events with no related rows return zero totals.
- Soft-deleted events, registrations, and exhibitors are excluded.
- Cancelled conferences are excluded.
- Results follow event order.

Frontend coverage verifies:

- The dashboard action preserves `event_summaries` and falls back to `[]`.
- The shared component renders active and inactive states.
- Zero and formatted non-zero totals render correctly.

Run focused Go tests for the changed backend packages and focused Jest tests
for the dashboard action and component.

## Out of Scope

- Changing or removing existing project-level metrics.
- Event filters, pagination, drill-down links, charts, or new endpoints.
- Refactoring unrelated dashboard error handling.

## Acceptance Criteria

- Admin and Organizer dashboards show a card for every non-deleted event,
  including inactive events.
- Each card displays accurate participant, exhibitor, and non-cancelled
  conference totals.
- Empty events display zero for all three totals.
- Dashboard loading uses one API call and does not introduce application-level
  N+1 requests.
