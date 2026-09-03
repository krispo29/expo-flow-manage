# Admin Lead Scanner Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Admin users a Lead Scanner usage report with company metrics and Excel export.

**Architecture:** A server action validates the Admin/project scope, calls the two API endpoints and returns typed report data or export bytes. A client component loads, filters, refreshes, and downloads that data; a thin Admin route passes the selected project ID.

**Tech Stack:** Next.js 16, React 19, TypeScript, Axios, shadcn UI, Lucide, Sonner, Jest, React Testing Library.

## Global Constraints

- Endpoint paths: `/v1/admin/project/lead-scanner/usage` and `/v1/admin/project/lead-scanner/export-excel-usage`.
- Use existing authenticated server headers with the selected `projectId`; no new dependencies.
- Do not invent date filtering, pagination, or server-side search.
- Admin-only navigation preserves `projectId`.

---

## File Structure

- `src/app/actions/lead-scanner.ts`: typed, authorized API boundary.
- `src/components/lead-scanner-usage.tsx`: client state, UI, local search, and download.
- `src/app/admin/(dashboard)/lead-scanner/page.tsx`: route that passes `projectId`.
- `src/components/app-sidebar.tsx`: Admin-only menu item.
- `src/__tests__/actions/lead-scanner.test.ts`: action behavior.
- `src/__tests__/components/lead-scanner-usage.test.tsx`: UI behavior.

### Task 1: Add the authorized Lead Scanner server action

**Files:**
- Create: `src/app/actions/lead-scanner.ts`
- Test: `src/__tests__/actions/lead-scanner.test.ts`

**Interfaces:**
- Produces `getLeadScannerUsage(projectId?: string): Promise<LeadScannerUsageResult>` and `exportLeadScannerUsage(projectId?: string): Promise<LeadScannerExportResult>`.
- `LeadScannerUsage` is `{ startDate: string; endDate: string; overall: Array<{ companyName: string; totalScanned: number; totalContact: number }> }`.

- [ ] **Step 1: Write the failing action tests**

```ts
await expect(getLeadScannerUsage('project-a')).resolves.toEqual({
  success: true,
  data: { startDate: '2026-09-02', endDate: '2026-09-04', overall: [] },
})
expect(mockApiGet).toHaveBeenCalledWith('/v1/admin/project/lead-scanner/usage', {
  headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
})

await expect(exportLeadScannerUsage('project-a')).resolves.toMatchObject({
  success: true, bytes: [1, 2, 3], filename: 'lead-scanner.xlsx',
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/__tests__/actions/lead-scanner.test.ts`

Expected: FAIL because the action module does not exist.

- [ ] **Step 3: Write minimal implementation**

Use the Business Matching action as the authorization model: require `ADMIN`, require `projectId`, run `verifyProjectAccess`, and call `requireServerAuthHeaders({ projectUuid: projectId })`. Map API snake_case fields into the interface above. On the export call, specify `responseType: 'arraybuffer'`, convert `new Uint8Array(response.data)` to `number[]`, read the filename from `content-disposition`, and default to `lead-scanner-usage.xlsx`. Return `getErrorMessage(error)` from all error paths.

```ts
const response = await api.get('/v1/admin/project/lead-scanner/export-excel-usage', {
  headers,
  responseType: 'arraybuffer',
})
return { success: true, bytes: Array.from(new Uint8Array(response.data)), filename }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/__tests__/actions/lead-scanner.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/lead-scanner.ts src/__tests__/actions/lead-scanner.test.ts
git commit -m "feat: add lead scanner usage actions"
```

### Task 2: Build the Lead Scanner report UI and route

**Files:**
- Create: `src/components/lead-scanner-usage.tsx`
- Create: `src/app/admin/(dashboard)/lead-scanner/page.tsx`
- Test: `src/__tests__/components/lead-scanner-usage.test.tsx`

**Interfaces:**
- Consumes the two Task 1 actions and `projectId?: string`.
- Produces `<LeadScannerUsage projectId?: string />` and `/admin/lead-scanner`.

- [ ] **Step 1: Write failing UI tests**

```tsx
render(<LeadScannerUsage projectId="project-a" />)
expect(await screen.findByText(/Sep 2, 2026.*Sep 4, 2026/i)).toBeInTheDocument()
expect(screen.getByText('33')).toBeInTheDocument()
expect(screen.getAllByRole('row')[1]).toHaveTextContent('A&D Instruments')

await user.type(screen.getByPlaceholderText(/search companies/i), 'Dose')
expect(screen.queryByText('A&D Instruments')).not.toBeInTheDocument()
await user.click(screen.getByRole('button', { name: /export excel/i }))
expect(mockExportLeadScannerUsage).toHaveBeenCalledWith('project-a')
```

Cover loading, empty data, initial request failure with Retry, refresh failure preserving loaded rows, and failed export toast.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/__tests__/components/lead-scanner-usage.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Write minimal implementation**

The page awaits its Next.js `searchParams` and returns `<LeadScannerUsage projectId={projectId} />`. The client component loads on mount and reloads from Refresh. Use `useMemo` for totals, a descending `totalScanned` sort, and case-insensitive company filtering. Use cards for totals and a `Table` with Company, Scanned, and Contacts. Show API period in the heading, counts through `toLocaleString()`, independent busy states for refresh/export, and explicit loading/empty/error/retry views.

```tsx
const blob = new Blob([new Uint8Array(result.bytes)], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
})
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = result.filename
link.click()
URL.revokeObjectURL(url)
```

Use `toast.success` for a completed download and `toast.error` for action failures.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/__tests__/components/lead-scanner-usage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lead-scanner-usage.tsx src/app/admin/(dashboard)/lead-scanner/page.tsx src/__tests__/components/lead-scanner-usage.test.tsx
git commit -m "feat: add lead scanner usage report"
```

### Task 3: Add menu and verify integration

**Files:**
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/__tests__/components/lead-scanner-usage.test.tsx`

**Interfaces:**
- Consumes `/admin/lead-scanner` from Task 2.
- Produces an Admin-only sidebar link.

- [ ] **Step 1: Add the minimal sidebar item**

Import `ScanLine` from Lucide and add the item to System & Tools near Reports:

```tsx
{user?.role === 'ADMIN' && (
  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip="Lead Scanner" isActive={isActive(`${basePath}/lead-scanner`)}>
      <Link href={projectId ? `${basePath}/lead-scanner?projectId=${projectId}` : `${basePath}/lead-scanner`}>
        <ScanLine />
        <span>Lead Scanner</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
)}
```

- [ ] **Step 2: Run focused tests and a production build**

Run: `npm test -- --runInBand src/__tests__/actions/lead-scanner.test.ts src/__tests__/components/lead-scanner-usage.test.tsx && npm run build`

Expected: both test suites PASS and the Next.js build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/app-sidebar.tsx src/__tests__/components/lead-scanner-usage.test.tsx
git commit -m "feat: add lead scanner navigation"
```

## Self-Review

- Task 1 covers authorization, API calls, and Excel bytes; Task 2 covers report UX, filtering, download, and feedback; Task 3 covers Admin navigation and verification.
- No unrequested filters, dependencies, or speculative abstractions are included.
