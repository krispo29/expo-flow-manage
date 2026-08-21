# Organizer Upgrade Requests

## Goal

Give Thailand Lab organizers the same questionnaire-triggered attendee upgrade
review workflow currently available to admins, through Organizer-specific
routes and API endpoints.

## Scope

- Add the `Upgrade Requests` sidebar and command-palette entry for the
  `ORGANIZER` role.
- Add `/organizer/upgrade-requests`.
- Reuse the existing `UpgradeRequestQueue` UI, including filtering, refresh,
  approval, rejection, dialogs, and feedback states.
- Keep `/admin/upgrade-requests` and its existing Admin API calls unchanged.

## API and Authorization

The server action determines the current authenticated role and selects the
corresponding endpoint. It continues to use the authenticated Organizer
project context and project-access validation.

| Operation | Admin endpoint | Organizer endpoint |
| --- | --- | --- |
| List requests | `/v1/admin/project/upgrade-requests` | `/v1/organizer/upgrade-requests` |
| Review request | `/v1/admin/project/upgrade-requests/review` | `/v1/organizer/upgrade-requests/review` |
| List attendee types | `/v1/admin/project/participants/attendee_types` | `/v1/organizer/participants/attendee_types` |

Review payloads, response mapping, errors, and queue behavior remain the
same for both roles. After a successful review, revalidate the matching role's
upgrade-request and participant routes. `getAllAttendeeTypes` becomes
role-aware, so both the initial load and the queue's approval choices use the
matching attendee-types endpoint.

The Organizer route must require the `ORGANIZER` role before rendering. It
obtains its project ID exclusively from the authenticated server context; if
that context has no project ID, it shows the existing missing-project state.
The Admin route must require the `ADMIN` role. A user who visits the other
role's route is redirected to their own dashboard rather than rendering a
cross-role page.

## Components and Data Flow

1. The Organizer page requires an Organizer session, resolves its project ID
   from the authenticated context (not a query string, cookie, or selector),
   loads upgrade requests and attendee types, and renders the shared queue.
2. The queue refreshes and submits reviews through the same role-aware action
   contracts used by the initial page load.
3. The action routes the request to the Organizer endpoint for `ORGANIZER`
   users and preserves the existing Admin endpoint for `ADMIN` users.
4. The sidebar and command palette generate the `/organizer/upgrade-requests`
   link for Organizers and preserve the Admin link for Admins.

## Error Handling

- A failed list, refresh, or review returns the API error message through the
  existing visible error state or toast.
- Unauthorized users or project mismatches are rejected by the existing
  server-side authorization helpers before any API call.
- Missing project context retains the existing select-project empty state.

## Verification

- Add/update action tests to assert endpoint selection by role for request
  lists, reviews, and attendee types; assert revalidation of both the
  matching upgrade-request and participant routes after review.
- Add/update navigation tests or focused assertions for Organizer visibility.
- Verify direct navigation to each role's route redirects a user with the
  other role to their own dashboard.
- Run targeted Jest tests, lint/type validation, and the production build when
  practical.
- Manually verify the Organizer menu, queue, refresh, approval dialog, and
  rejection dialog without submitting a real review.
