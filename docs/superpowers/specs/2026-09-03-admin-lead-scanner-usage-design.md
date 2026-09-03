# Admin Lead Scanner Usage Design

## Goal

Give Admin users a quick, trustworthy view of Lead Scanner adoption by company and a direct Excel export of the same report.

## Scope

- Add an Admin-only sidebar item named `Lead Scanner` that navigates to `/admin/lead-scanner` and preserves the selected `projectId` query parameter.
- Create an Admin-only Lead Scanner page that requests `GET /v1/admin/project/lead-scanner/usage` when opened.
- Show the API-provided report period (`start_date` through `end_date`), total scanned leads, total contacts, and a per-company table with company name, scanned leads, and contacts.
- Order the table by scanned leads descending and allow in-page filtering by company name without refetching data.
- Provide a refresh control and an Export Excel control. Export calls `GET /v1/admin/project/lead-scanner/export-excel-usage`, downloads the response as an `.xlsx` file, and exposes loading and failure feedback.
- Handle loading, empty, and request-failure states accessibly and consistently with existing Admin report pages.

## Constraints

- Do not add filters, pagination, or date selection because the supplied endpoints do not define those parameters.
- Reuse the existing Axios API client, authentication flow, shadcn UI components, lucide icons, Sonner toast feedback, and browser Blob download pattern.
- Do not add dependencies.
- Keep the implementation limited to this report and its navigation entry.

## Data Contract

`GET /v1/admin/project/lead-scanner/usage` returns an object with `data.start_date`, `data.end_date`, and `data.overall`. Each `overall` item contains `company_name`, `total_scanned`, and `total_contact`.

`GET /v1/admin/project/lead-scanner/export-excel-usage` returns the Excel file for download. Use a timestamped fallback filename when the response omits `Content-Disposition`.

## UX

The page loads the current API-defined reporting period immediately. The header keeps the report period visible, while summary cards surface the two totals before the table. A company search makes long lists scannable. Refresh and export controls have independent busy states so an export does not block a data refresh. Errors keep any previously loaded data visible and offer a retry path.

## Verification

- Component tests cover loading and populated report content, company filtering, empty state, usage-request failure, and export behavior.
- A focused Jest test run and a production build pass.
