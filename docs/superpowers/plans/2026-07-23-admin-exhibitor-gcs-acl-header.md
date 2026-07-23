# Admin Exhibitor GCS ACL Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make direct image uploads from the shared admin and organizer exhibitor form include the ACL header required by GCS signed URLs.

**Architecture:** Add one header to `ExhibitorForm`'s existing direct PUT request. Admin and organizer routes already share this component, so no role-specific changes are needed.

**Tech Stack:** Next.js, React, TypeScript, browser Fetch API, Google Cloud Storage V4 signed URLs.

## Global Constraints

- Send `x-goog-acl: public-read` with the existing `Content-Type` header.
- Do not modify backend, bucket configuration, API contract, validation, resizing, or UI.
- Add no dependencies or abstractions.

---

### Task 1: Send the signed ACL header

**Files:**
- Modify: `src/components/exhibitor-form.tsx:287-291`
- Test: targeted ESLint invocation for `src/components/exhibitor-form.tsx`

**Interfaces:**
- Consumes: `presign.uploadUrl`, signed by the existing backend with `x-goog-acl: public-read`.
- Produces: A PUT request that includes the GCS-required ACL header for both user roles.

- [ ] **Step 1: Add the required header to the existing PUT request**

```ts
headers: {
  'Content-Type': file.type,
  'x-goog-acl': 'public-read',
},
```

- [ ] **Step 2: Run the targeted lint check**

Run: `npx eslint src/components/exhibitor-form.tsx`

Expected: process exits with code 0.

- [ ] **Step 3: Verify both headers are present**

Run: `rg -n -C 2 "x-goog-acl|Content-Type" src/components/exhibitor-form.tsx`

Expected: the direct PUT request includes `Content-Type: file.type` and `x-goog-acl: public-read`.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/components/exhibitor-form.tsx docs/superpowers/plans/2026-07-23-admin-exhibitor-gcs-acl-header.md
git commit -m "fix: send signed admin upload ACL header"
```

## Self-Review

- Spec coverage: Task 1 changes the shared request used by both ADMIN and ORGANIZER routes, without changing the listed out-of-scope behavior.
- Placeholder scan: no deferred requirements or undefined code remain.
- Type consistency: no type, interface, or API changes are required.
