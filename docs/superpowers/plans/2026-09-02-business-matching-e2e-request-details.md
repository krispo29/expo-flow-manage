# Business Matching E2E Request Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show requester and recipient company details for exhibitor-to-exhibitor requests in the admin report modal.

**Architecture:** Keep the existing visitor-to-exhibitor rendering path unchanged. In the request-card renderer, derive whether an item is exhibitor-originated from its existing API fields; E2E cards render labeled requester and recipient company rows from the report response instead of visitor fields.

**Tech Stack:** Next.js, React, TypeScript, Jest, React Testing Library.

## Global Constraints

- Do not change the Business Matching API or matching workflow.
- Preserve the current Visitor-to-Exhibitor card display.
- Render E2E company rows only from existing `exhibitor_company_name`, `recipient_exhibitor_name`, `booth_no`, and `recipient_exhibitor_booth` fields.
- Do not display `Visitor details unavailable` for E2E requests.

---

### Task 1: Render exhibitor-to-exhibitor request participants

**Files:**
- Modify: `src/components/business-matching/admin-report-detail-modal.tsx:455-482`
- Modify: `src/__tests__/components/business-matching/business-matching-summary.test.tsx:46-72`

**Interfaces:**
- Consumes: report item fields `requester_type`, `recipient_exhibitor_uuid`, `exhibitor_company_name`, `recipient_exhibitor_name`, `booth_no`, and `recipient_exhibitor_booth`.
- Produces: E2E request cards that identify requester and recipient companies without visitor fallback copy.

- [ ] **Step 1: Write the failing component test**

Add an E2E `match-requests` response to the existing test file and open the Requested details modal:

```tsx
mockGetBusinessMatchingDetails.mockResolvedValue({
  success: true,
  items: [{
    match_request_uuid: 'req-e2e-1',
    requester_type: 'exhibitor',
    recipient_exhibitor_uuid: 'exhibitor-recipient',
    exhibitor_company_name: 'AA Company',
    recipient_exhibitor_name: 'BB Company',
    booth_no: 'A1',
    recipient_exhibitor_booth: 'B2',
    status: 'Requested',
  }],
  total: 1,
})
```

Assert that `Requester: AA Company`, `Recipient: BB Company`, `Booth A1`, and `Booth B2` are displayed, and `Visitor details unavailable` is absent.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --runInBand src/__tests__/components/business-matching/business-matching-summary.test.tsx`

Expected: FAIL because the request card currently renders the visitor fallback.

- [ ] **Step 3: Implement the minimal rendering branch**

In the `kind === 'requests'` map callback, derive `isExhibitorToExhibitor` from `requester_type === 'exhibitor' && recipient_exhibitor_uuid`. When true, replace the visitor identity block with two labeled company rows using `exhibitor_company_name` and `recipient_exhibitor_name`, appending each available booth. Keep the existing visitor identity block for all other requests.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- --runInBand src/__tests__/components/business-matching/business-matching-summary.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the related action test**

Run: `npm test -- --runInBand src/__tests__/actions/business-matching-report.test.ts`

Expected: PASS, confirming the unchanged report request action remains valid.

- [ ] **Step 6: Commit**

```bash
git add src/components/business-matching/admin-report-detail-modal.tsx src/__tests__/components/business-matching/business-matching-summary.test.tsx
git commit -m "fix: identify E2E requests in admin reports"
```
