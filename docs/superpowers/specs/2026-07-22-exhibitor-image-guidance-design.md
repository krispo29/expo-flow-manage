# Exhibitor Image Guidance Design

## Goal

Show the requested image-format, size, and recommended aspect-ratio guidance
for Company Logo and Product Highlight uploads.

## Design

- Add the Company Logo note directly below its file input.
- Add the Product Highlight note below the Product Highlights section heading.
- Keep the text in the shared `ExhibitorForm`, used by Admin and Organizer
  create and edit pages.
- Do not change upload behavior or add validation; this request is display-only.

## Verification

- Confirm both notes appear when Company Profile fields are enabled.
- Run the TypeScript check or lint command available in the project.
