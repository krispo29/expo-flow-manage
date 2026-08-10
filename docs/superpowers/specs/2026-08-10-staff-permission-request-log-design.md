# Staff Permission Request Log

## Goal

Expose the exact staff event-permission request context and JSON payload in the development server log so the numeric UUID decoding failure can be diagnosed.

## Design

Immediately before the existing `PUT /v1/admin/project/staff/{staff_uuid}/event-permissions` call, log one structured object containing the endpoint, project UUID, staff UUID, and payload. Guard the log with `process.env.NODE_ENV === 'development'` so production behavior and logs are unchanged.

The existing request flow and payload remain unchanged:

```json
{
  "event_uuids": []
}
```

or an array of selected UUID strings.

## Verification

Run the existing static checks, then trigger Save Permissions in development and confirm the server terminal prints the structured request immediately before the API response or error log.
