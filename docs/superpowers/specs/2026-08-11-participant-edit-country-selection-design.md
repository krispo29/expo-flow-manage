# Participant Edit Country Selection Design

## Scope

Change the Admin and Organizer participant edit dialog only. The create dialog
continues to default both country fields to Vietnam.

## Behaviour

- Rename the phone-prefix label from `Country Code *` to `Mobile Country Code *`.
- When editing a participant with an empty `mobile_country_code`, leave the
  selector empty and show its existing `Select` placeholder.
- When editing a participant with an empty `residence_country`, leave the
  selector empty and show its existing `Select country` placeholder.
- Preserve the current normalization for populated country values, including
  phone-code and country-code representations.
- If loading participant detail fails, do not synthesize Vietnam values for the
  edit form; use the values available in the list row when present.

## Implementation

Keep the change confined to `src/components/participant-list.tsx`. Pass an empty
fallback to the existing country normalization helpers during edit initialization;
the selector and hidden inputs already support an empty value. No API contracts,
database data, or create-form defaults change.

## Verification

Add focused component coverage for the edit initialization paths: empty values
show placeholders and populated values retain their selected countries. Run the
relevant test file and the project's type/lint checks available in package scripts.
