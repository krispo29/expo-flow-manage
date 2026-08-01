# Conference Session Owner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional `session_owner` support to Admin and Organizer Conference Create/Edit/List/Details.

**Architecture:** Reuse the shared `ConferenceForm`, `Conference` interface, and `ConferenceList`. Keep the existing Admin and Organizer actions separate and add the same string field to all four JSON payloads.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest

## Global Constraints

- `session_owner` is optional text.
- Empty updates send `session_owner: ""` so an existing value is cleared.
- No dependency, abstraction, backend, import/export, filter, or search changes.

---

### Task 1: Send Session Owner Through Admin and Organizer Actions

**Files:**
- Modify: `src/app/actions/conference.ts`
- Modify: `src/app/actions/organizer-conference.ts`
- Test: `src/__tests__/actions/conference.test.ts`
- Test: `src/__tests__/actions/organizer-conference.test.ts`

**Interfaces:**
- Consumes: `FormData` with optional `session_owner` string.
- Produces: Admin and Organizer create/update JSON payloads containing `session_owner: string`.

- [ ] **Step 1: Extend existing action tests to require the field**

Append `session_owner` to create fixtures and assert it in `objectContaining`. In one update fixture append an empty string and assert `session_owner: ''`.

```ts
formData.append('session_owner', 'ExpoFlow Team')
expect.objectContaining({ session_owner: 'ExpoFlow Team' })

formData.append('session_owner', '')
expect.objectContaining({ session_owner: '' })
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- --runInBand src/__tests__/actions/conference.test.ts src/__tests__/actions/organizer-conference.test.ts`

Expected: FAIL because the payloads do not contain `session_owner`.

- [ ] **Step 3: Add the field to all four action payloads**

In each create/update action, read and include the string without converting an empty value to `undefined`.

```ts
const sessionOwner = (formData.get('session_owner') as string) || ''

const body = {
  // existing fields
  session_owner: sessionOwner,
}
```

- [ ] **Step 4: Re-run focused tests**

Run: `npm test -- --runInBand src/__tests__/actions/conference.test.ts src/__tests__/actions/organizer-conference.test.ts`

Expected: PASS.

### Task 2: Add Shared Form, List, and Details UI

**Files:**
- Modify: `src/app/actions/conference.ts`
- Modify: `src/components/conference-form.tsx`
- Modify: `src/components/conference-list.tsx`

**Interfaces:**
- Consumes: API responses with optional `session_owner`.
- Produces: One optional form input and conditional List/Details values shared by both roles.

- [ ] **Step 1: Extend the shared interface**

```ts
export interface Conference {
  // existing fields
  session_owner?: string
}
```

- [ ] **Step 2: Add the optional form input**

```tsx
<div className="space-y-2">
  <Label htmlFor="session_owner">Session Owner</Label>
  <Input
    id="session_owner"
    name="session_owner"
    defaultValue={conference?.session_owner ?? ''}
    placeholder="e.g. ExpoFlow Team"
  />
</div>
```

- [ ] **Step 3: Render non-empty values in List and Details**

Use the existing information blocks and guard both locations with:

```tsx
{conference.session_owner?.trim() && <p>{conference.session_owner}</p>}
{previewConference.session_owner?.trim() && <p>{previewConference.session_owner}</p>}
```

- [ ] **Step 4: Run verification**

Run: `npm test -- --runInBand src/__tests__/actions/conference.test.ts src/__tests__/actions/organizer-conference.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: exit code 0.
