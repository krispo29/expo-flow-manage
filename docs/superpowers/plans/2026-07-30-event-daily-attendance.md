# Event Daily Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display each event's API-provided daily local and overseas attendance in the shared Dashboard Event Overview without consuming space until requested.

**Architecture:** Extend the existing event summary TypeScript contract with one optional array, then render that array inside the existing shared `EventSummaryCards`. Wrap each completed table in a native closed-by-default `details`/`summary` disclosure so every event toggles independently without React state. The existing dashboard action and component already serve both Admin and Organizer dashboards, so no page or endpoint changes are needed.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, existing table primitives, Jest, Testing Library

## Global Constraints

- Keep the API date string unchanged as `YYYY-MM-DD`.
- Treat missing `daily_attendance` as an empty array.
- Use `toLocaleString()` for attendance counts.
- Add no dependency, sorting, filtering, pagination, chart, total, or React state.
- Preserve existing Event Overview unavailable and no-events states.

---

### Task 1: Extend and preserve the dashboard contract

**Files:**
- Modify: `src/app/actions/dashboard.ts:51-59`
- Test: `src/__tests__/actions/dashboard.test.ts:59-104`

**Interfaces:**
- Consumes: API `event_summaries[].daily_attendance`
- Produces: `DashboardDailyAttendance` and `DashboardEventSummary.daily_attendance?: DashboardDailyAttendance[]`

- [ ] **Step 1: Extend the successful action test fixture**

Add this property to the API event summary and the expected result:

```ts
daily_attendance: [
  { date: '2026-09-02', local: 1234, oversea: 56 },
],
```

Add a contract-level assertion after the result comparison:

```ts
expect(result.data?.event_summaries[0].daily_attendance).toEqual([
  { date: '2026-09-02', local: 1234, oversea: 56 },
])
```

- [ ] **Step 2: Run the focused test and verify TypeScript rejects the new prop**

Run:

```powershell
npx jest src/__tests__/actions/dashboard.test.ts --runInBand
```

Expected: the test suite fails to compile at the contract-level assertion
because `daily_attendance` is not in `DashboardEventSummary`.

- [ ] **Step 3: Add the minimal optional contract**

Add above `DashboardEventSummary`:

```ts
export interface DashboardDailyAttendance {
  date: string
  local: number
  oversea: number
}
```

Add inside `DashboardEventSummary`:

```ts
daily_attendance?: DashboardDailyAttendance[]
```

No action mapping is added because `event_summaries: rawData.event_summaries || []` already preserves each event object unchanged.

- [ ] **Step 4: Run the focused action test**

Run:

```powershell
npx jest src/__tests__/actions/dashboard.test.ts --runInBand
```

Expected: PASS.

### Task 2: Render the compact attendance table

**Files:**
- Modify: `src/components/dashboard/event-summary-cards.tsx:1-89`
- Test: `src/__tests__/components/dashboard/event-summary-cards.test.tsx:4-54`

**Interfaces:**
- Consumes: `DashboardEventSummary.daily_attendance?: DashboardDailyAttendance[]`
- Produces: one `Date | Local | Oversea` table per event, with `No attendance data` fallback

- [ ] **Step 1: Add failing rendering assertions**

Add `daily_attendance` to Event A:

```ts
daily_attendance: [
  { date: '2026-09-02', local: 1234, oversea: 56 },
  { date: '2026-09-03', local: 789, oversea: 10 },
],
```

Keep Event B without the optional field and assert:

```ts
expect(screen.getByText('Date')).toBeInTheDocument()
expect(screen.getByText('Local')).toBeInTheDocument()
expect(screen.getByText('Oversea')).toBeInTheDocument()
expect(screen.getByText('2026-09-02')).toBeInTheDocument()
expect(screen.getByText('2026-09-03')).toBeInTheDocument()
expect(screen.getByText('1,234')).toBeInTheDocument()
expect(screen.getByText('56')).toBeInTheDocument()
expect(screen.getByText('789')).toBeInTheDocument()
expect(screen.getByText('10')).toBeInTheDocument()
expect(screen.getByText('No attendance data')).toBeInTheDocument()
```

- [ ] **Step 2: Run the focused component test and verify it fails**

Run:

```powershell
npx jest src/__tests__/components/dashboard/event-summary-cards.test.tsx --runInBand
```

Expected: FAIL because the attendance table is not rendered.

- [ ] **Step 3: Render existing table primitives below each event's summary row**

Import:

```ts
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
```

Change `CardContent` to a vertical container. Keep the existing event header and metrics together in their current responsive row, then render:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead className="text-right">Local</TableHead>
      <TableHead className="text-right">Oversea</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {(event.daily_attendance ?? []).length > 0 ? (
      (event.daily_attendance ?? []).map((attendance) => (
        <TableRow key={attendance.date}>
          <TableCell>{attendance.date}</TableCell>
          <TableCell className="text-right">
            {attendance.local.toLocaleString()}
          </TableCell>
          <TableCell className="text-right">
            {attendance.oversea.toLocaleString()}
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={3} className="text-center text-muted-foreground">
          No attendance data
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npx jest src/__tests__/actions/dashboard.test.ts src/__tests__/components/dashboard/event-summary-cards.test.tsx --runInBand
```

Expected: both suites PASS.

- [ ] **Step 5: Run static verification**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 6: Review the diff**

Run:

```powershell
git diff -- src/app/actions/dashboard.ts src/components/dashboard/event-summary-cards.tsx src/__tests__/actions/dashboard.test.ts src/__tests__/components/dashboard/event-summary-cards.test.tsx
```

Expected: only the optional contract, table rendering, and focused fixtures/assertions changed.

### Task 3: Hide each attendance table behind a native toggle

**Files:**
- Modify: `src/components/dashboard/event-summary-cards.tsx`
- Test: `src/__tests__/components/dashboard/event-summary-cards.test.tsx`

**Interfaces:**
- Consumes: the existing table rendered per `DashboardEventSummary`
- Produces: an independent closed-by-default native disclosure per event with visual `Show attendance` and `Hide attendance` labels

- [ ] **Step 1: Add a failing independent-toggle test**

Import `fireEvent` and add:

```tsx
it('toggles each attendance table independently', () => {
  render(
    <EventSummaryCards
      failed={false}
      events={[
        {
          event_uuid: 'a',
          event_code: 'EVENT_A',
          event_name: 'Event A',
          is_active: true,
          total_participants: 1,
          total_exhibitors: 1,
          total_conferences: 1,
        },
        {
          event_uuid: 'b',
          event_code: 'EVENT_B',
          event_name: 'Event B',
          is_active: true,
          total_participants: 1,
          total_exhibitors: 1,
          total_conferences: 1,
        },
      ]}
    />
  )

  const showLabels = screen.getAllByText('Show attendance')
  const firstSummary = showLabels[0].closest('summary')!
  const firstDisclosure = firstSummary.closest('details')!
  const secondDisclosure = showLabels[1].closest('details')!

  expect(firstDisclosure).not.toHaveAttribute('open')
  expect(secondDisclosure).not.toHaveAttribute('open')
  expect(firstSummary).toHaveTextContent('Hide attendance')

  fireEvent.click(firstSummary)
  expect(firstDisclosure).toHaveAttribute('open')
  expect(secondDisclosure).not.toHaveAttribute('open')

  fireEvent.click(firstSummary)
  expect(firstDisclosure).not.toHaveAttribute('open')
})
```

- [ ] **Step 2: Run the focused component test and verify it fails**

Run:

```powershell
npx jest src/__tests__/components/dashboard/event-summary-cards.test.tsx --runInBand
```

Expected: FAIL because `Show attendance` does not exist.

- [ ] **Step 3: Wrap the existing table in the native disclosure**

```tsx
<details className="group">
  <summary className="cursor-pointer list-none text-sm font-medium text-primary">
    <span className="group-open:hidden">Show attendance</span>
    <span className="hidden group-open:inline">Hide attendance</span>
  </summary>
  <div className="mt-3">
    {/* existing Table remains unchanged here */}
  </div>
</details>
```

Do not add `open`, React state, event handlers, or a new component.

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npx jest src/__tests__/components/dashboard/event-summary-cards.test.tsx --runInBand
npx tsc --noEmit
```

Expected: component suite PASS and TypeScript exits with code 0.

- [ ] **Step 5: Review the scoped diff**

Run:

```powershell
git diff -- src/components/dashboard/event-summary-cards.tsx src/__tests__/components/dashboard/event-summary-cards.test.tsx
```

Expected: only the native disclosure wrapper and its focused test changed.
