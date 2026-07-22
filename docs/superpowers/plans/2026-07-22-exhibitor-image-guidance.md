# Exhibitor Image Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the requested Company Logo and Product Highlights image guidance for Admin and Organizer create and edit forms.

**Architecture:** Add static `FormDescription` content in the shared `ExhibitorForm`. All four routes already render this component, so no route, data, upload, or validation changes are needed.

**Tech Stack:** Next.js, React, TypeScript, react-hook-form, existing shadcn form components.

## Global Constraints

- Copy must state JPG or PNG only, maximum 2 MB, and the requested recommended dimensions.
- Company Logo guidance belongs directly below its file input.
- Product Highlight guidance appears once below the Product Highlights heading, before repeated highlight fields.
- Do not change upload behavior or validation.

---

### Task 1: Render shared image guidance

**Files:**
- Modify: `src/components/exhibitor-form.tsx:441-476`
- Test: manual browser verification of Admin and Organizer create/edit Exhibitor pages

**Interfaces:**
- Consumes: existing `FormDescription` imported from `@/components/ui/form`.
- Produces: static guidance displayed whenever `showCompanyProfileFields` is true.

- [ ] **Step 1: Inspect the shared render paths**

Run:

```powershell
rg -n "ExhibitorForm|Company Logo|Product Highlights" src/components/exhibitor-form.tsx src/app/admin src/app/organizer
```

Expected: Admin and Organizer create/edit routes all render `ExhibitorForm`; the two upload areas are defined in that component.

- [ ] **Step 2: Add the minimal static guidance**

In `src/components/exhibitor-form.tsx`, directly after the Company Logo `<FormControl>` block, add:

```tsx
<FormDescription>
  Note:<br />
  - Format & Size: JPG or PNG only (Max. 2 MB)<br />
  - Company Logo: 1:1 ratio recommended (e.g., 512 x 512 px)
</FormDescription>
```

Directly after the Product Highlights `<CardDescription>`, add:

```tsx
<FormDescription>
  Note:<br />
  - Format & Size: JPG or PNG only (Max. 2 MB)<br />
  - Product Highlight: Landscape 16:9 ratio recommended (e.g., 1280 x 720 px / 1920 x 1080 px)
</FormDescription>
```

- [ ] **Step 3: Run static verification**

Run:

```powershell
npm run lint
npx tsc --noEmit
```

Expected: both commands exit with code 0.

- [ ] **Step 4: Verify the UI manually**

With Company Profile fields enabled, open Admin and Organizer Exhibitor create and edit pages. Confirm the Company Logo note is below its input, and the Product Highlight note appears once below the section heading. Confirm existing image previews and add/remove controls still work.

- [ ] **Step 5: Commit**

```powershell
git add src/components/exhibitor-form.tsx
git commit -m "feat(exhibitor): add image upload guidance"
```

## Self-Review

- Spec coverage: Task 1 covers both guidance blocks, their exact placement, all shared Admin/Organizer create/edit paths, and preserves current behavior.
- Placeholder scan: no unfinished implementation or verification directions remain.
- Type consistency: no interfaces or types are changed.
