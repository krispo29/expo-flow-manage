# Secure Organizer Quota Requests Implementation Plan

**Goal:** Scope every Organizer quota-request operation to the project embedded in its verified JWT.

**Architecture:** Mount the existing quota-request handlers at an Organizer-specific backend route behind `OrganizerProjectInterceptor`, which places the JWT project claim in request context. Add Organizer-only frontend actions that call this route without a project argument, then render the shared quota-request page in Organizer mode so it does not depend on a query parameter.

## Tasks

1. Expose the existing quota-request handler router at `/v1/organizer/quota-requests` under the Organizer JWT project middleware.
2. Add Organizer server actions that omit `X-Project-UUID` and call the Organizer route.
3. Make the shared page select these actions in Organizer mode, while keeping Admin query-based behavior unchanged.
4. Run focused frontend tests/build and Go tests for the affected packages.
