# Business Matching E2E Request Details Design

## Goal

Make the admin Business Matching request-detail modal identify exhibitor-to-exhibitor (E2E) requests by the requester and recipient companies instead of showing `Visitor details unavailable`.

## Scope

- Keep the existing visitor-to-exhibitor display unchanged.
- When a request has an exhibitor requester and a recipient exhibitor, display:
  - `Requester: <source exhibitor company>`
  - `Recipient: <target exhibitor company>`
- Include booth information when it is present in the existing API response.
- Do not change the report API or the matching workflow.

## Data Flow

The report endpoint already supplies `exhibitor_company_name`, `recipient_exhibitor_name`, `booth_no`, and `recipient_exhibitor_booth` for E2E requests. The modal will detect E2E from `requester_type === 'exhibitor'` or the presence of `recipient_exhibitor_uuid`, then render company details from those fields.

## Error Handling

If a company name is missing, its labeled row is omitted rather than displaying a misleading visitor fallback.

## Testing

Add a component test whose match-request item represents an E2E request with empty visitor fields. It must show the requester and recipient company labels and must not show `Visitor details unavailable`.
