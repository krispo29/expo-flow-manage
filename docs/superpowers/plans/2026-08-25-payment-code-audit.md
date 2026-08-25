# Payment Code Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give ADMIN users a project-scoped Payment Codes page that shows availability, consumption time, and the registration that consumed a code.

**Architecture:** Extend the existing `paymentcodepool` domain with read-only project-scoped list/export queries, expose them through authenticated admin routes, then render them in the management portal through typed server actions. A consumed-code link reuses Participants with a `registration_code` filter rather than creating another registration-detail screen.

**Tech Stack:** Go 1.24, chi, go-pg, PostgreSQL, Excelize, Next.js 16, React 19, TypeScript, Jest, shadcn/ui, date-fns.

## Global Constraints

- No database migration: `payment_code_pools` already has `status`, `used_at`, and `used_by_registration_uuid`.
- Backend authorization is ADMIN-only and every query uses the `X-Project-UUID` context.
- Summary respects `search` but ignores the `status` filter; list/export respect both.
- List order is `used_at DESC NULLS LAST, code ASC`; default page size is 25, maximum 100.
- Never infer consumption from validation attempts; read only the fields committed by `ConsumeCode`.
- Keep domain methods project-scoped for future Organizer authorization, but do not expose this version to Organizer.

---

## File structure

### Backend: `D:\Works\expoflow-service`

- Modify `internal/domain/paymentcodepool/model.go`, `service.go`, `svc.go`, and `repo.go` to add list DTOs, query normalization, and repository/service list/export methods.
- Create `internal/domain/paymentcodepool/payment_code_query_test.go` for project isolation, filters, summary, sort, pagination, and missing-registration tests.
- Create `internal/handler/admin/payment_code.go` and `payment_code_test.go` for ADMIN endpoints and Excel output.
- Modify `internal/handler/admin/handler.go` to register routes.

### Management portal: `C:\Users\Mike\Desktop\Works\expo-flow-manage`

- Create `src/app/actions/payment-code.ts`, `src/components/payment-code-list.tsx`, `src/app/admin/(dashboard)/payment-codes/page.tsx`.
- Create `src/__tests__/actions/payment-code.test.ts` and `src/__tests__/components/payment-code-list.test.tsx`.
- Modify `src/components/app-sidebar.tsx`, `src/app/admin/(dashboard)/participants/page.tsx`, and `src/components/participant-list.tsx`.
- Create `src/__tests__/components/participant-list.test.tsx`.

### Task 1: Add the payment-code read model

**Files:**
- Modify: `D:\Works\expoflow-service\internal\domain\paymentcodepool\model.go`
- Modify: `D:\Works\expoflow-service\internal\domain\paymentcodepool\service.go`
- Modify: `D:\Works\expoflow-service\internal\domain\paymentcodepool\svc.go`
- Modify: `D:\Works\expoflow-service\internal\domain\paymentcodepool\repo.go`
- Create: `D:\Works\expoflow-service\internal\domain\paymentcodepool\payment_code_query_test.go`

**Interfaces:**
- Consumes: `payment_code_pools` and `registrations` data scoped by project UUID.
- Produces: `List(ctx, projectUUID string, query ListQuery) (*ListResponse, error)` and `ListForExport(ctx, projectUUID string, query ListQuery) (*ListResponse, error)`.

- [ ] **Step 1: Write failing domain tests**

Seed used and unused rows in two projects. Test project isolation, `all|unused|used`, code/name/email search, search-scoped/status-independent summary, deterministic second page, and a used code with a missing registration join.

```go
result, err := service.List(ctx, projectA, ListQuery{Status: StatusUsed, Page: 1, PageSize: 25})
require.NoError(t, err)
require.Equal(t, 1, result.Summary.Used)
require.Equal(t, "REG-001", result.Items[0].Registration.RegistrationCode)
```

- [ ] **Step 2: Confirm the test fails**

Run: `go test ./internal/domain/paymentcodepool -run TestPaymentCodeList -count=1`

Expected: FAIL because the list contract does not exist.

- [ ] **Step 3: Add DTOs and contracts**

Add `ListQuery{Status, Search string; Page, PageSize int}`, `RegistrationPreview{RegistrationUUID, RegistrationCode, FirstName, LastName, Email}`, `ListItem{PaymentCodeUUID, Code, Status, UsedAt, UsedByRegistrationUUID, Registration}`, `Summary{Total, Unused, Used}`, and `ListResponse{Summary, Items, Page, PageSize, Total}` with JSON tags. Add the two list methods to Service/Repository and delegate in `svc.go`.

- [ ] **Step 4: Implement normalized SQL**

Normalize status, trim search, clamp page and page size. Use one WHERE builder in items/count/summary/export. Items/export must left join:

```sql
LEFT JOIN registrations r
  ON r.registration_uuid = p.used_by_registration_uuid
 AND r.project_uuid = p.project_uuid
WHERE p.project_uuid = ?
ORDER BY p.used_at DESC NULLS LAST, p.code ASC
```

Append status and `ILIKE` predicates for code, registration code, first name, last name, email. The summary omits only the status predicate. Set `Registration=nil` if the join returns no registration UUID.

- [ ] **Step 5: Verify and commit**

```powershell
gofmt -w internal/domain/paymentcodepool
go test ./internal/domain/paymentcodepool -run 'TestPaymentCodeList|TestValidateRows' -count=1
git add internal/domain/paymentcodepool
git commit -m "feat(payment-codes): add project-scoped audit queries"
```

Expected: tests pass.

### Task 2: Add ADMIN list and Excel endpoints

**Files:**
- Modify: `D:\Works\expoflow-service\internal\handler\admin\handler.go`
- Create: `D:\Works\expoflow-service\internal\handler\admin\payment_code.go`
- Create: `D:\Works\expoflow-service\internal\handler\admin\payment_code_test.go`

**Interfaces:**
- Consumes: Task 1 list methods.
- Produces: `GET /v1/admin/project/payment-codes` and `GET /v1/admin/project/payment-codes/export`.

- [ ] **Step 1: Write failing handler tests**

Test non-admin gets 403, missing project context gets 400, invalid status/page/page_size gets 400, a valid list returns summary/page/items, and export returns XLSX with exactly the filtered fixture rows.

- [ ] **Step 2: Register and implement handlers**

Within `RoutesWithProjectContext` add:

```go
r.Route("/payment-codes", func(r chi.Router) {
    r.Get("/", h.getPaymentCodes)
    r.Get("/export", h.exportPaymentCodes)
})
```

Both handlers call `requireAdminClaim`, read only `contextutil.GetProjectUUID`, parse query inputs, return `shared.ErrInvalidRequest` for malformed input, and call Task 1 methods. The export uses Excelize with: Payment Code, Status, Used At, Registration Code, First Name, Last Name, Email; use empty cells for absent registration fields and RFC3339 UTC for `used_at`.

- [ ] **Step 3: Verify and commit**

```powershell
gofmt -w internal/handler/admin
go test ./internal/handler/admin ./internal/domain/paymentcodepool -run 'TestPaymentCode|TestValidateRows' -count=1
git add internal/handler/admin
git commit -m "feat(admin): add payment code audit endpoints"
```

Expected: focused tests pass.

### Task 3: Add typed portal actions

**Files:**
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\actions\payment-code.ts`
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\__tests__\actions\payment-code.test.ts`

**Interfaces:**
- Consumes: Task 2 endpoints and `requireServerAuthHeaders({ projectUuid })`.
- Produces: `getPaymentCodes(projectUuid, filters)` and `exportPaymentCodes(projectUuid, filters)`.

- [ ] **Step 1: Write failing action tests**

Mock `@/lib/api`. Assert headers include Authorization and `X-Project-UUID`; list forwards status/search/page/page_size; export forwards status/search only, uses `arraybuffer`, and returns `Uint8Array`.

```ts
await getPaymentCodes('project-456', { status: 'used', search: 'REG-001', page: 2, pageSize: 25 })
expect(mockApiGet).toHaveBeenCalledWith(
  '/v1/admin/project/payment-codes',
  expect.objectContaining({ params: { status: 'used', search: 'REG-001', page: 2, page_size: 25 } }),
)
```

- [ ] **Step 2: Implement and verify**

Export `PaymentCodeStatus`, `PaymentCodeFilters`, registration preview, item, and response types. Return stable empty data plus `getErrorMessage(error)` on failure. Then run:

```powershell
npm test -- --runInBand src/__tests__/actions/payment-code.test.ts
git add src/app/actions/payment-code.ts src/__tests__/actions/payment-code.test.ts
git commit -m "feat(payment-codes): add admin portal data actions"
```

Expected: test passes.

### Task 4: Build the ADMIN page and sidebar entry

**Files:**
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\components\payment-code-list.tsx`
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\admin\(dashboard)\payment-codes\page.tsx`
- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\components\app-sidebar.tsx`
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\__tests__\components\payment-code-list.test.tsx`

**Interfaces:**
- Consumes: Task 3 actions and the selected `projectId`.
- Produces: ADMIN-only `/admin/payment-codes?projectId=...`.

- [ ] **Step 1: Write failing UI tests**

Cover summary cards, initial status from URL, empty/error states, used row participant link, dangling used row without link, copy success, pagination, and current status/search forwarded to export.

- [ ] **Step 2: Implement UI behavior**

Use existing `Card`, `Table`, `Select`, `Input`, `Button`, `Badge`, `sonner`, `date-fns`, and lucide icons. Read `projectId/status/search/page`; show the established no-project state if missing. Debounce search 300 ms, reset to page 1 on search/status change, and use `router.replace` to preserve URL state. Render `used_at` as `dd MMM yyyy, HH:mm` or `—`. Copy button writes the code to clipboard.

For used rows that have `registration`, use exactly:

```ts
`/admin/participants?projectId=${encodeURIComponent(projectId)}&registration_code=${encodeURIComponent(item.registration.registration_code)}`
```

Import `KeyRound` and add the Payment Codes sidebar link next to Invitation Codes inside the existing `user?.role === 'ADMIN'` condition only.

- [ ] **Step 3: Verify and commit**

```powershell
npm test -- --runInBand src/__tests__/components/payment-code-list.test.tsx
npx tsc --noEmit
git add src/components/payment-code-list.tsx src/app/admin/(dashboard)/payment-codes/page.tsx src/components/app-sidebar.tsx src/__tests__/components/payment-code-list.test.tsx
git commit -m "feat(admin): add payment code audit page"
```

Expected: test/type check pass.

### Task 5: Support participant prefilter links

**Files:**
- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\admin\(dashboard)\participants\page.tsx`
- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\components\participant-list.tsx`
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\__tests__\components\participant-list.test.tsx`

**Interfaces:**
- Consumes: `registration_code` URL parameter from Task 4.
- Produces: existing Participants list with its Registration Code filter initialized.

- [ ] **Step 1: Write failing prefilter test**

```tsx
render(<ParticipantList participants={participants} projectId="project-1" attendeeTypes={[]} events={[]} initialRegistrationCode="REG-001" />)
expect(screen.getByDisplayValue('REG-001')).toBeInTheDocument()
expect(screen.getByText('Alice')).toBeInTheDocument()
expect(screen.queryByText('Bob')).not.toBeInTheDocument()
```

- [ ] **Step 2: Implement and verify**

Extend page search params with `registration_code`, pass it as `initialRegistrationCode`, and initialize the component's existing registration-code column filter from it. Absence preserves current behavior.

```powershell
npm test -- --runInBand src/__tests__/components/participant-list.test.tsx src/__tests__/components/payment-code-list.test.tsx src/__tests__/actions/payment-code.test.ts
npx tsc --noEmit
git add src/app/admin/(dashboard)/participants/page.tsx src/components/participant-list.tsx src/__tests__/components/participant-list.test.tsx
git commit -m "feat(participants): support payment code links"
```

Expected: all listed tests pass.

### Task 6: Final verification

- [ ] **Step 1: Run backend validation**

In `D:\Works\expoflow-service`:

```powershell
gofmt -w internal/domain/paymentcodepool internal/handler/admin
go test ./internal/domain/paymentcodepool ./internal/handler/admin -count=1
go test ./...
go vet ./...
```

- [ ] **Step 2: Run portal validation**

In `C:\Users\Mike\Desktop\Works\expo-flow-manage`:

```powershell
npm test -- --runInBand
npx tsc --noEmit
npm run build
```

- [ ] **Step 3: Perform the acceptance check**

1. Sign in as ADMIN and select THAILAB2026.
2. Confirm summary cards, search, status filter, pagination, code copy, and filtered XLSX export.
3. Open a used registration link and verify Participants is prefiltered by its registration code.
4. Confirm a dangling used record has no broken link.
5. Sign in as ORGANIZER: no sidebar item, and the backend endpoint returns 403.

- [ ] **Step 4: Inspect worktrees**

```powershell
git -C D:\Works\expoflow-service status --short
git -C C:\Users\Mike\Desktop\Works\expo-flow-manage status --short
```

Expected: only intended changes are present.

