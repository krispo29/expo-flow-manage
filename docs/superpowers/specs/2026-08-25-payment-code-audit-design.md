# Payment Code Audit Design

## Goal

Give ADMIN users a project-scoped Payment Codes page that shows which codes remain available, which codes have been used, and the registration and time associated with each use.

## Scope

The feature spans the ExpoFlow service and the ExpoFlow management portal. It is read-only: it does not create, delete, reset, or otherwise alter payment codes.

## Data source

Payment codes already live in `payment_code_pools`, scoped by `project_uuid`. The existing columns are the source of truth:

- `code`
- `status` (`unused` or `used`)
- `used_at`
- `used_by_registration_uuid`
- `import_history_uuid`

For a used code, the API will join the associated registration to return the registration UUID, registration code, attendee name, and email. Unused-code registration fields are null.

No database migration is required.

## Authorization and project isolation

Version one is available to ADMIN users only. The backend must enforce that rule; hiding the sidebar link is not authorization.

The list, export, summary, and registration link data are always limited by the current `X-Project-UUID` project context. The API/service/repository interfaces will retain the explicit project UUID input so a future ORGANIZER permission can reuse the endpoints while preserving project isolation.

## API

Add these authenticated admin endpoints below `/v1/admin/project/payment-codes`:

- `GET /` — paginated list plus summary counts.
- `GET /export` — XLSX export using the same filters as the list.

Supported list and export query parameters:

- `status`: `all`, `unused`, or `used`; default `all`.
- `search`: optional case-insensitive search over payment code, registration code, first name, last name, and email.
- `page`: positive integer; default `1` (list only).
- `page_size`: positive integer, maximum `100`; default `25` (list only).

The list response contains a `summary` object (`total`, `unused`, `used`) and a paginated `items` collection. Summary counts apply to the current `search` term but ignore the `status` filter, so an ADMIN can see both available and used totals while viewing either status. Each item includes the payment-code audit fields and, when used, a compact registration object. If a consumed code's registration cannot be joined, the code row remains with `status: "used"`, its audit UUID and timestamp, and `registration: null`. The export has the same columns visible in the table, without exposing questionnaire answers or unrelated registration details.

List rows have a deterministic default order: `used_at DESC NULLS LAST`, then `code ASC`.

Invalid filters return a structured 400 response. An empty filtered page returns 200 with an empty `items` collection, not 404. Its summary still follows the search-scoped, status-independent rule above; all summary counts are zero only when the search matches no codes in the project.

## Management portal

Add an ADMIN-only `Payment Codes` navigation item and route under the existing project dashboard.

The page includes:

- Summary cards for total, unused, and used codes.
- A searchable, paginated table with Code, Status, Used at, Registration code, Registrant, and Email columns.
- Status filter and text search that update the URL query string, so the current view can be refreshed or shared.
- Copy-to-clipboard control for each code.
- Used registration links open the existing Participants page with the selected project and a `registration_code` filter, so the matching registrant is immediately visible in its existing management workflow. Unused rows and used rows whose registration is unavailable have no participant link.
- An Export XLSX control that exports exactly the selected project and active search/status filters.
- Loading, empty, and request-error states consistent with existing dashboard pages.

The table does not display full registration detail inline. Admins use the registration link for that information.

## Data flow

1. An ADMIN selects a project through the existing project context.
2. The page server action sends the authenticated request with the selected `X-Project-UUID`.
3. The backend authorizes ADMIN access, validates filters, queries payment-code rows scoped to the project, and left-joins only the consumed registration.
4. The browser renders summary cards and the current page. Changing the filter, search, or page reloads the corresponding API result.
5. Export passes the same normalized filters to the backend and downloads its XLSX response.

## Consistency and audit behavior

The existing registration transaction remains the sole writer for consumption: it changes `status` to `used` and records `used_at` and `used_by_registration_uuid` together. This feature only reads those fields; it must never infer usage from validation attempts, because validation does not consume a code.

## Verification

Backend tests cover ADMIN authorization, project isolation, filters, pagination, joined used-registration fields, empty results, and export/list filter parity.

Portal tests cover ADMIN navigation visibility, successful list rendering, empty state, search/filter request behavior, used-row registration link, no unused-row link, and export URL/filter forwarding. Existing role behavior must show no menu entry for ORGANIZER.
