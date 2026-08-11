# Event Overview Attendance Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Event Overview attendance toggle copy to the approved labels.

**Architecture:** Replace two text nodes in the shared dashboard component and update the focused component test. Native disclosure behavior remains unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest, Testing Library.

## Global Constraints

- Closed label: `On show Attendance`.
- Open label: `On Hide Attendance`.
- Change visible copy only; preserve existing Admin and Organizer behavior.

---

### Task 1: Update attendance toggle labels

**Files:**

- Modify: `src/components/dashboard/event-summary-cards.tsx:103-105`
- Modify: `src/__tests__/components/dashboard/event-summary-cards.test.tsx:95-102`

**Interfaces:**

- Consumes: native `details`/`summary` disclosure state.
- Produces: exact approved labels for closed and open states.

- [x] **Step 1: Update the regression test strings**

```ts
const showLabels = screen.getAllByText('On show Attendance')
expect(firstSummary).toHaveTextContent('On Hide Attendance')
```

- [x] **Step 2: Replace the two component text nodes**

```tsx
<span className="group-open:hidden">On show Attendance</span>
<span className="hidden group-open:inline">On Hide Attendance</span>
```

- [x] **Step 3: Run verification**

Run: `npm test -- --runInBand src/__tests__/components/dashboard/event-summary-cards.test.tsx; npm run build`

Expected: both commands exit with code 0.

- [x] **Step 4: Commit**

```bash
git add src/components/dashboard/event-summary-cards.tsx src/__tests__/components/dashboard/event-summary-cards.test.tsx docs/superpowers/plans/2026-08-11-event-overview-attendance-labels.md
git commit -m "fix: update event attendance labels"
```
