# Import Dropdown Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Imports dropdowns show a disabled loading state until their own option data is available, reserving empty copy for completed empty results.

**Architecture:** Add an optional `loading` prop to the shared Combobox. Track the four option requests independently in the Imports page and pass the corresponding loading flag to each selector. No server action or import submission changes are required.

**Tech Stack:** React 19, TypeScript, Testing Library, Jest, lucide-react.

## Global Constraints

- Do not add dependencies or change server actions/API contracts.
- Do not modify import validation or submission behavior.
- Reuse the existing `Loader2` icon and current component styling.

---

### Task 1: Expose an accessible Combobox loading state

**Files:**

- Modify: `src/components/ui/combobox.tsx`
- Create: `src/__tests__/components/ui/combobox.test.tsx`

**Interfaces:**

- Produces: `ComboboxProps.loading?: boolean`; setting it renders `Loading…` in the trigger and sets `disabled`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { Combobox } from '@/components/ui/combobox'

describe('Combobox', () => {
  it('shows a disabled loading trigger instead of the empty state', () => {
    render(<Combobox loading emptyMessage="No events found" placeholder="Select event" options={[]} />)

    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('No events found')).not.toBeInTheDocument()
  })

  it('shows the empty message after loading completes with no options', () => {
    render(<Combobox emptyMessage="No events found" placeholder="Select event" options={[]} />)

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('No events found')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/__tests__/components/ui/combobox.test.tsx`

Expected: FAIL because `ComboboxProps` does not accept `loading`.

- [ ] **Step 3: Add the minimal loading prop**

```tsx
import { Check, ChevronsDown, Loader2 } from 'lucide-react'

export interface ComboboxProps {
  // existing props
  loading?: boolean
}

<Button disabled={disabled || loading}>
  {loading ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Loading…</span></>
  ) : (
    <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
      {selectedOption ? selectedOption.label : placeholder}
    </span>
  )}
  <ChevronsDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
```

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --runInBand src/__tests__/components/ui/combobox.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/combobox.tsx src/__tests__/components/ui/combobox.test.tsx
git commit -m "fix: show combobox loading state"
```

### Task 2: Settle Imports option loading independently

**Files:**

- Modify: `src/app/admin/(dashboard)/imports/page.tsx`
- Test: `src/__tests__/components/ui/combobox.test.tsx`

**Interfaces:**

- Consumes: `ComboboxProps.loading` from Task 1.
- Produces: per-dataset loading state for events, exhibitors, attendee types, and staff types.

- [ ] **Step 1: Add independent option loading state**

```tsx
const [optionsLoading, setOptionsLoading] = useState({
  events: true,
  exhibitors: true,
  attendeeTypes: true,
  staffTypes: true,
})
```

- [ ] **Step 2: Start all requests but settle each in its own async loader**

```tsx
void (async () => {
  try {
    const eventsRes = await getImportEvents()
    if (eventsRes.success) {
      setEvents(eventsRes.data)
      // retain the existing default event selection logic
    }
  } finally {
    setOptionsLoading((current) => ({ ...current, events: false }))
  }
})()
```

Repeat the same contained `try`/`finally` pattern for exhibitors, import histories, attendee types, and staff types; only the four selector datasets receive an `optionsLoading` entry. Keep existing successful response assignments and defaults unchanged.

- [ ] **Step 3: Wire loading to every affected selector**

```tsx
<Combobox options={eventOptions} loading={optionsLoading.events} /* existing props */ />
<Combobox options={exhibitorOptions} loading={optionsLoading.exhibitors} /* existing props */ />
<Combobox options={attendeeTypeOptions} loading={optionsLoading.attendeeTypes} /* existing props */ />
<Combobox
  options={staffTypes.map((type) => ({ value: type.type_code, label: `${type.type_name} (${type.type_code})` }))}
  loading={optionsLoading.staffTypes}
  /* existing props */
/>
```

Apply the event flag to all four event selectors, including invitation codes.

- [ ] **Step 4: Verify behavior and compilation**

Run: `npm test -- --runInBand src/__tests__/components/ui/combobox.test.tsx`

Expected: PASS (2 tests).

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(dashboard)/imports/page.tsx
git commit -m "fix: distinguish import option loading states"
```

