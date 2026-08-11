# Participant Edit Country Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leave empty mobile and residence country values unselected when editing a participant, while retaining Vietnam defaults for participant creation.

**Architecture:** Reuse existing country-normalization helpers with an empty fallback only during edit-form initialization. The selector already renders a placeholder for an empty value; `openCreate` remains unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest.

## Global Constraints

- Change the Admin and Organizer participant edit dialog only.
- Preserve `VN` defaults in `openCreate`.
- Do not change API payload shapes or country data.
- Display the exact label `Mobile Country Code *`.

---

### Task 1: Preserve empty country selections in participant edit

**Files:**

- Modify: `src/components/participant-list.tsx:424-436,1173`
- Modify: `src/__tests__/lib/countries.test.ts:154-176`

**Interfaces:**

- Consumes: `getCountryCodeFromValue(value, fallbackCode)` and `getCountryCodeFromPhoneCodeOrValue(value, fallbackCode)`.
- Produces: empty selector state for blank edit values; normalized ISO country code for populated edit values.

- [x] **Step 1: Extend the country helper regression test**

```ts
expect(getCountryCodeFromValue('', '')).toBe('')
expect(getCountryCodeFromPhoneCodeOrValue('', '')).toBe('')
```

- [x] **Step 2: Run the focused test and verify it passes**

Run: `npm test -- --runInBand src/__tests__/lib/countries.test.ts`

Expected: PASS; the helpers support an explicit empty fallback.

- [x] **Step 3: Initialize edit state with empty fallbacks and rename the field**

```tsx
const residenceCountryCode = getCountryCodeFromValue(result.data.residence_country, '')
setResidenceCountry(residenceCountryCode)
setMobileCountryCode(getCountryCodeFromPhoneCodeOrValue(result.data.mobile_country_code, ''))
```

For a detail-request failure, derive the same values from `p` with `''` fallbacks. Change the label to `Mobile Country Code *`.

- [x] **Step 4: Run verification**

Run: `npm test -- --runInBand src/__tests__/lib/countries.test.ts; npx tsc --noEmit`

Expected: both commands exit with code 0.

- [x] **Step 5: Commit**

```bash
git add src/components/participant-list.tsx src/__tests__/lib/countries.test.ts docs/superpowers/plans/2026-08-11-participant-edit-country-selection.md
git commit -m "fix: preserve empty participant edit countries"
```
