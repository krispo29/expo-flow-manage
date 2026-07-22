# Exhibitor Image Guidance Design

## Goal

Show the requested image-format, size, and recommended aspect-ratio guidance
for Company Logo and Product Highlight uploads.

## Design

- Add the following note directly below the Company Logo file input:
  - `Note:`
  - `- Format & Size: JPG or PNG only (Max. 2 MB)`
  - `- Company Logo: 1:1 ratio recommended (e.g., 512 x 512 px)`
- Add the following note once below the Product Highlights section heading,
  before its individual highlight inputs:
  - `Note:`
  - `- Format & Size: JPG or PNG only (Max. 2 MB)`
  - `- Product Highlight: Landscape 16:9 ratio recommended (e.g., 1280 x 720 px / 1920 x 1080 px)`
- Keep the text in the shared `ExhibitorForm`, used by Admin and Organizer
  create and edit pages.
- Do not change upload behavior or add validation; this request is display-only.

## Verification

- Confirm both notes appear when Company Profile fields are enabled.
- Run the TypeScript check or lint command available in the project.
