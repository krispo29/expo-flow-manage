# THAILAB2026 Taiwan Country Label Design

## Goal

Show `Taiwan` instead of `Taiwan Province of China` in country selectors only when the active project's `project_code` is `THAILAB2026`, without changing the value selected or submitted to backend services.

## Design

Keep `countries` as the source of truth, with the TW entry named `Taiwan Province of China`. A shared pure label helper will return `Taiwan` only for country code TW and project code `THAILAB2026`; it otherwise returns the canonical name. `CountrySelector` will determine the active project from the existing session-storage project list and selected project ID, while the independent Admin Projects selector will pass the `project_code` of the project being edited.

The selector continues to call `onChange('TW')`. Existing form code and server actions therefore continue resolving TW to `Taiwan Province of China` before API/database submission. No API contract or stored-data migration is needed.

## Validation

Add focused unit tests for the shared label helper, proving the special-project and default labels, plus the existing country-normalization regression proving `TW` resolves to `Taiwan Province of China` at the payload boundary. Add render-level tests for the shared selector and Admin Projects selector so the user-visible labels and their project-code wiring are protected. Run the affected test suite and a production build before delivery.
