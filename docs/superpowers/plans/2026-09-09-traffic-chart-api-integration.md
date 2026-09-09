# Traffic Chart API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render backend-supplied peak-hour traffic on Lead Scanner and the admin Dashboard.

**Architecture:** Server actions normalize endpoint payloads into a shared chart model. The existing peak-hour card consumes that model; Lead Scanner selects a daily chart and Dashboard passes attendance data directly.

**Tech Stack:** Next.js, TypeScript, React, Recharts, Jest.

## Global Constraints

- Preserve backend labels and peak metadata.
- Missing charts render 24 zero-value points; never synthesize traffic.
- Do not add dependencies or alter API endpoints.

---

### Task 1: Normalize API chart payloads

**Files:**
- Modify: `src/app/actions/lead-scanner.ts`
- Modify: `src/app/actions/dashboard.ts`
- Test: `src/__tests__/actions/lead-scanner.test.ts`
- Test: `src/__tests__/actions/dashboard.test.ts`

**Interfaces:** Produces a `TrafficChart` with `data`, `peakHour`, and `peakScans`.

- [ ] **Step 1: Write failing action tests**

```ts
expect(result.data?.days?.[1].chart?.data).toEqual([{ hour: 13, label: '1PM', scans: 1604 }])
expect(result.data?.attendance_chart?.data[0]).toEqual({ date: '2026-09-02', hour: 13, label: '2026-09-02 1PM', scans: 1604 })
```

- [ ] **Step 2: Run the targeted action tests**

Run: `npm test -- --runInBand src/__tests__/actions/lead-scanner.test.ts src/__tests__/actions/dashboard.test.ts`

- [ ] **Step 3: Add minimal action mappings**

```ts
const chart = mapTrafficChart(rawData.attendance_chart)
const dayChart = mapTrafficChart(day.chart)
```

- [ ] **Step 4: Rerun the targeted action tests**

Run: `npm test -- --runInBand src/__tests__/actions/lead-scanner.test.ts src/__tests__/actions/dashboard.test.ts`

### Task 2: Bind charts to the peak-hour card

**Files:**
- Modify: `src/components/lead-scanner-peak-hours.tsx`
- Modify: `src/components/lead-scanner-usage.tsx`
- Test: `src/__tests__/components/lead-scanner-peak-hours.test.tsx`
- Test: `src/__tests__/components/lead-scanner-usage.test.tsx`

**Interfaces:** Consumes `TrafficChart` and renders the selected daily chart or a zero-valued fallback.

- [ ] **Step 1: Write failing component tests**

```tsx
render(<LeadScannerPeakHours chart={{ peakHour: 13, peakScans: 9, data: [{ hour: 13, label: '1PM', scans: 9 }] }} />)
expect(screen.getByTestId('peak-time-value')).toHaveTextContent('1PM')
```

- [ ] **Step 2: Run targeted component tests**

Run: `npm test -- --runInBand src/__tests__/components/lead-scanner-peak-hours.test.tsx src/__tests__/components/lead-scanner-usage.test.tsx`

- [ ] **Step 3: Implement chart selection and zero fallback**

```ts
const activeChart = selectedDay === 'total' ? undefined : activeDay?.chart
const chartData = chart?.data?.length ? chart.data : ZERO_HOURS
```

- [ ] **Step 4: Rerun targeted component tests**

Run: `npm test -- --runInBand src/__tests__/components/lead-scanner-peak-hours.test.tsx src/__tests__/components/lead-scanner-usage.test.tsx`

### Task 3: Add the Dashboard traffic card

**Files:**
- Modify: `src/app/admin/(dashboard)/page.tsx`

**Interfaces:** Consumes `DashboardData.attendance_chart` from Task 1.

- [ ] **Step 1: Add the card below key metrics**

```tsx
<LeadScannerPeakHours chart={result.data?.attendance_chart} />
```

- [ ] **Step 2: Verify the complete change**

Run: `npm test -- --runInBand src/__tests__/actions/lead-scanner.test.ts src/__tests__/actions/dashboard.test.ts src/__tests__/components/lead-scanner-peak-hours.test.tsx src/__tests__/components/lead-scanner-usage.test.tsx`

Run: `npm run lint`
