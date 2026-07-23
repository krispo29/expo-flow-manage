# Design Spec: Admin Exhibitor GCS ACL Header

## Goal

Make exhibitor image uploads from the shared admin and organizer form satisfy the existing GCS signed URL header requirement.

## Change

Add `x-goog-acl: public-read` alongside the existing `Content-Type` header in `ExhibitorForm`'s direct PUT request.

Both ADMIN and ORGANIZER routes render this shared form, so this single change covers both roles.

## Out of Scope

- No backend or bucket configuration changes.
- No validation, resize, API contract, or UI changes.

## Verification

- The targeted lint check passes.
- The direct PUT request contains both `Content-Type` and `x-goog-acl: public-read`.
