# THAILAB2026 Taiwan Country Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display Taiwan as `Taiwan` only in THAILAB2026 country selectors while preserving `Taiwan Province of China` in submitted data.

**Architecture:** Add a shared pure country-label helper that applies the presentation-only TW override for `THAILAB2026`. The shared client-side country selector reads the selected project's code from session storage; Admin Projects passes its edited project's code. Both preserve the selector's `TW` callback value and existing canonical normalization.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest, Testing Library.

## Global Constraints

- Only project code `THAILAB2026` receives the shortened selector label.
- All other project codes display `Taiwan Province of China`.
- Country selection and backend payload normalization remain canonical and use country code `TW` / `Taiwan Province of China`.

---

### Task 1: Project-aware Taiwan label

**Files:**
- Modify: `src/components/CountrySelector.tsx`
- Modify: `src/app/admin/projects/page.tsx`
- Modify: `src/lib/countries.ts`
- Test: `src/__tests__/lib/countries.test.ts`
- Test: `src/__tests__/components/CountrySelector.test.tsx`
- Test: `src/__tests__/app/admin/projects/page.test.tsx`

**Interfaces:**
- Consumes: `getStoredProjects(): StoredProject[]` and `getSelectedProject(): string | null` from `src/lib/auth-storage.ts`, and a shared `getCountryDisplayName(country, projectCode)` helper.
- Produces: Selector option and trigger labels that are `Taiwan` only for THAILAB2026, including the Admin Projects editor; `onChange` continues to receive `TW` and project submission continues to use canonical values.

- [ ] Write failing unit tests in `countries.test.ts` for `getCountryDisplayName(getCountryByCode('TW')!, 'THAILAB2026') === 'Taiwan'`, for a different project code returning `Taiwan Province of China`, and retain `getCountryNameFromValue('TW') === 'Taiwan Province of China'` as the canonical payload-normalization regression. In `CountrySelector.test.tsx`, seed session storage for THAILAB2026, open the selector, assert its trigger and option say `Taiwan`, and assert selection calls `onChange('TW')`. In `projects/page.test.tsx`, mock a THAILAB2026 project and countries response, open its editor, and assert the trigger and option say `Taiwan`.
- [ ] Run `npm test -- --runInBand src/__tests__/lib/countries.test.ts src/__tests__/components/CountrySelector.test.tsx src/__tests__/app/admin/projects/page.test.tsx` and confirm the new assertions fail before implementation.
- [ ] Add the minimal shared display-label helper in `countries.ts`; use it in `CountrySelector` only when `displayProperty === 'name'` and in Admin Projects with `editingProject?.project_code`. Do not change `onChange(country.code)` or Admin Projects' existing `selectedCountryName` submission mapping.
- [ ] Run `npm test -- --runInBand src/__tests__/lib/countries.test.ts src/__tests__/components/CountrySelector.test.tsx src/__tests__/app/admin/projects/page.test.tsx` and `npm run build`.
- [ ] Commit the implementation, push `staging`, fast-forward merge it into `main`, and push `main`.
