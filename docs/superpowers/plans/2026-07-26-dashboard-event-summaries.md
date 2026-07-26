# Dashboard Event Summaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show participant, exhibitor, and non-cancelled conference totals for every non-deleted event on both Admin and Organizer dashboards.

**Architecture:** Extend the existing Admin dashboard response with `event_summaries`. The event repository performs one SQL query with correlated counts, the existing dashboard action normalizes the field, and one shared React component renders the approved card grid on both pages.

**Tech Stack:** Go 1.25, go-pg v9, PostgreSQL, Next.js 16, React 19, TypeScript, Tailwind CSS, Jest, Testing Library.

## Global Constraints

- Frontend repository: `C:\Users\Mike\Desktop\Works\expo-flow-manage`.
- Backend repository: `D:\Works\expoflow-service`.
- Include every non-deleted event, including inactive events.
- Preserve all existing project-level dashboard metrics.
- Count only non-deleted registrations and exhibitors.
- Exclude conferences whose status is `cancelled`.
- Use one dashboard API request and no application-level N+1 requests.
- Order events by `order_index ASC, event_uuid ASC`.
- Add no dependencies, filters, pagination, charts, drill-down links, or new endpoints.
- Preserve unrelated backend changes in `database/seeds/`.

---

## File Map

### Backend

- `internal/domain/event/model.go`: owns the event-summary response model.
- `internal/domain/event/service.go`: exposes the repository and service contracts.
- `internal/domain/event/svc.go`: forwards the service call to the repository.
- `internal/domain/event/repo.go`: runs the single per-event aggregation query.
- `internal/domain/event/repo_test.go`: verifies active/inactive, zero, deletion, cancellation, and ordering behavior.
- `internal/handler/admin/handler.go`: adds `event_summaries` to the existing dashboard response and handles query failure.

### Frontend

- `src/app/actions/dashboard.ts`: owns the API types and response normalization.
- `src/__tests__/actions/dashboard.test.ts`: verifies response preservation and backward-compatible `[]`.
- `src/components/dashboard/event-summary-cards.tsx`: renders the shared approved card grid.
- `src/__tests__/components/dashboard/event-summary-cards.test.tsx`: verifies status, zero, and formatted totals.
- `src/app/admin/(dashboard)/page.tsx`: renders the shared section for Admin.
- `src/app/organizer/(dashboard)/page.tsx`: renders the shared section for Organizer.

---

### Task 1: Backend Event Summary Query

**Files:**

- Create: `D:\Works\expoflow-service\internal\domain\event\repo_test.go`
- Modify: `D:\Works\expoflow-service\internal\domain\event\model.go`
- Modify: `D:\Works\expoflow-service\internal\domain\event\service.go`
- Modify: `D:\Works\expoflow-service\internal\domain\event\svc.go`
- Modify: `D:\Works\expoflow-service\internal\domain\event\repo.go`

**Interfaces:**

- Produces: `GetDashboardSummaries(ctx context.Context, projectUUID string) ([]*DashboardEventSummary, error)`.
- Produces: `DashboardEventSummary` with the exact JSON fields required by the frontend.

- [ ] **Step 1: Write the failing repository integration test**

Create `internal/domain/event/repo_test.go`:

```go
package event

import (
	"context"
	"fmt"
	"os"
	"testing"

	"expoflow/config"
	"expoflow/database"

	"github.com/go-pg/pg/v9"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func TestGetDashboardSummariesIntegration(t *testing.T) {
	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../../.env")
	if os.Getenv("POSTGRESQL_HOST") == "" {
		t.Skip("POSTGRESQL_HOST is not set")
	}

	cfg := config.LoadConfig()
	db, err := database.NewPostgreSQLConnection(
		cfg.PostgreSQLUser,
		cfg.PostgreSQLPassword,
		cfg.PostgreSQLName,
		cfg.PostgreSQLHost,
		cfg.PostgreSQLPort,
		cfg.PostgreSQLSSLMode,
	)
	if err != nil {
		t.Fatalf("connect test database: %v", err)
	}
	defer db.Close() //nolint:errcheck

	var projectUUID string
	if _, err := db.QueryOne(
		pg.Scan(&projectUUID),
		`SELECT project_uuid FROM projects LIMIT 1`,
	); err != nil {
		t.Skipf("no project fixture available: %v", err)
	}

	var attendeeType string
	if _, err := db.QueryOne(
		pg.Scan(&attendeeType),
		`SELECT type_code FROM attendee_types LIMIT 1`,
	); err != nil {
		t.Skipf("no attendee type fixture available: %v", err)
	}

	firstEventUUID := uuid.NewString()
	secondEventUUID := uuid.NewString()
	if secondEventUUID < firstEventUUID {
		firstEventUUID, secondEventUUID = secondEventUUID, firstEventUUID
	}
	deletedEventUUID := uuid.NewString()
	activeRegistrationUUID := uuid.NewString()
	deletedRegistrationUUID := uuid.NewString()
	activeExhibitorUUID := uuid.NewString()
	deletedExhibitorUUID := uuid.NewString()
	activeConferenceUUID := uuid.NewString()
	cancelledConferenceUUID := uuid.NewString()

	t.Cleanup(func() {
		_, _ = db.Exec(
			`DELETE FROM conferences WHERE conference_uuid IN (?, ?)`,
			activeConferenceUUID,
			cancelledConferenceUUID,
		)
		_, _ = db.Exec(
			`DELETE FROM registrations WHERE registration_uuid IN (?, ?)`,
			activeRegistrationUUID,
			deletedRegistrationUUID,
		)
		_, _ = db.Exec(
			`DELETE FROM exhibitors WHERE exhibitor_uuid IN (?, ?)`,
			activeExhibitorUUID,
			deletedExhibitorUUID,
		)
		_, _ = db.Exec(
			`DELETE FROM events WHERE event_uuid IN (?, ?, ?)`,
			firstEventUUID,
			secondEventUUID,
			deletedEventUUID,
		)
	})

	if _, err := db.Exec(`
		INSERT INTO events
			(event_uuid, project_uuid, event_code, event_name, is_active, order_index, deleted_at)
		VALUES
			(?, ?, 'DASH_A', 'Dashboard Active', true, 99001, NULL),
			(?, ?, 'DASH_B', 'Dashboard Inactive', false, 99001, NULL),
			(?, ?, 'DASH_DELETED', 'Dashboard Deleted', true, 99002, NOW())
	`, firstEventUUID, projectUUID, secondEventUUID, projectUUID, deletedEventUUID, projectUUID); err != nil {
		t.Fatalf("insert events: %v", err)
	}

	for _, registration := range []struct {
		uuid      string
		deletedAt string
	}{
		{activeRegistrationUUID, "NULL"},
		{deletedRegistrationUUID, "NOW()"},
	} {
		query := fmt.Sprintf(`
			INSERT INTO registrations
				(registration_uuid, project_uuid, event_uuid, first_name, last_name,
				 company_name, job_position, email, attendee_type_code, deleted_at)
			VALUES (?, ?, ?, 'Dashboard', 'Test', 'Test Company', 'Tester', ?, ?, %s)
		`, registration.deletedAt)
		if _, err := db.Exec(
			query,
			registration.uuid,
			projectUUID,
			firstEventUUID,
			registration.uuid+"@example.com",
			attendeeType,
		); err != nil {
			t.Fatalf("insert registration: %v", err)
		}
	}

	for _, exhibitor := range []struct {
		uuid      string
		deletedAt string
	}{
		{activeExhibitorUUID, "NULL"},
		{deletedExhibitorUUID, "NOW()"},
	} {
		query := fmt.Sprintf(`
			INSERT INTO exhibitors
				(exhibitor_uuid, project_uuid, event_uuid, username, password_hash,
				 company_name, deleted_at)
			VALUES (?, ?, ?, ?, 'test', 'Dashboard Test', %s)
		`, exhibitor.deletedAt)
		if _, err := db.Exec(
			query,
			exhibitor.uuid,
			projectUUID,
			firstEventUUID,
			"dashboard-"+exhibitor.uuid,
		); err != nil {
			t.Fatalf("insert exhibitor: %v", err)
		}
	}

	if _, err := db.Exec(`
		INSERT INTO conferences
			(conference_uuid, project_uuid, event_uuid, title, show_date,
			 start_time, end_time, status)
		VALUES
			(?, ?, ?::uuid, 'Dashboard Available', CURRENT_DATE, '09:00', '10:00', 'available'),
			(?, ?, ?::uuid, 'Dashboard Cancelled', CURRENT_DATE, '10:00', '11:00', 'cancelled')
	`, activeConferenceUUID, projectUUID, firstEventUUID,
		cancelledConferenceUUID, projectUUID, firstEventUUID); err != nil {
		t.Fatalf("insert conferences: %v", err)
	}

	summaries, err := NewRepository(db).GetDashboardSummaries(
		context.Background(),
		projectUUID,
	)
	if err != nil {
		t.Fatalf("GetDashboardSummaries: %v", err)
	}

	find := func(eventUUID string) *DashboardEventSummary {
		for _, summary := range summaries {
			if summary.EventUUID == eventUUID {
				return summary
			}
		}
		return nil
	}

	active := find(firstEventUUID)
	if active == nil {
		t.Fatal("active event summary missing")
	}
	if !active.IsActive ||
		active.TotalParticipants != 1 ||
		active.TotalExhibitors != 1 ||
		active.TotalConferences != 1 {
		t.Fatalf("unexpected active summary: %+v", active)
	}

	inactive := find(secondEventUUID)
	if inactive == nil {
		t.Fatal("inactive event summary missing")
	}
	if inactive.IsActive ||
		inactive.TotalParticipants != 0 ||
		inactive.TotalExhibitors != 0 ||
		inactive.TotalConferences != 0 {
		t.Fatalf("unexpected inactive summary: %+v", inactive)
	}
	if find(deletedEventUUID) != nil {
		t.Fatal("soft-deleted event must not be returned")
	}

	activeIndex, inactiveIndex := -1, -1
	for index, summary := range summaries {
		switch summary.EventUUID {
		case firstEventUUID:
			activeIndex = index
		case secondEventUUID:
			inactiveIndex = index
		}
	}
	if activeIndex == -1 || inactiveIndex == -1 || activeIndex >= inactiveIndex {
		t.Fatalf("equal order_index must use event_uuid order: %+v", summaries)
	}
}
```

- [ ] **Step 2: Run the test and verify the missing contract**

Run:

```powershell
go test ./internal/domain/event -run TestGetDashboardSummariesIntegration -v
```

Expected: build failure because `GetDashboardSummaries` and
`DashboardEventSummary` do not exist. If `POSTGRESQL_HOST` is absent after the
code compiles, the integration test may report `SKIP`.

- [ ] **Step 3: Add the event summary model**

Append to `internal/domain/event/model.go`:

```go
type DashboardEventSummary struct {
	EventUUID        string `pg:"event_uuid" json:"event_uuid"`
	EventCode        string `pg:"event_code" json:"event_code"`
	EventName        string `pg:"event_name" json:"event_name"`
	IsActive         bool   `pg:"is_active" json:"is_active"`
	TotalParticipants int   `pg:"total_participants" json:"total_participants"`
	TotalExhibitors   int   `pg:"total_exhibitors" json:"total_exhibitors"`
	TotalConferences  int   `pg:"total_conferences" json:"total_conferences"`
}
```

- [ ] **Step 4: Extend the repository and service contracts**

Add this method to both interfaces in `internal/domain/event/service.go`:

```go
GetDashboardSummaries(ctx context.Context, projectUUID string) ([]*DashboardEventSummary, error)
```

Add this method to `internal/domain/event/svc.go`:

```go
func (s *service) GetDashboardSummaries(
	ctx context.Context,
	projectUUID string,
) ([]*DashboardEventSummary, error) {
	return s.repo.GetDashboardSummaries(ctx, projectUUID)
}
```

- [ ] **Step 5: Implement the single-query repository method**

Add to `internal/domain/event/repo.go`:

```go
func (r *pgRepository) GetDashboardSummaries(
	ctx context.Context,
	projectUUID string,
) ([]*DashboardEventSummary, error) {
	summaries := make([]*DashboardEventSummary, 0)
	_, err := r.db.WithContext(ctx).Query(&summaries, `
		SELECT
			e.event_uuid,
			COALESCE(e.event_code, '') AS event_code,
			e.event_name,
			COALESCE(e.is_active, false) AS is_active,
			(
				SELECT COUNT(*)
				FROM registrations r
				WHERE r.project_uuid = e.project_uuid
				  AND r.event_uuid = e.event_uuid
				  AND r.deleted_at IS NULL
			) AS total_participants,
			(
				SELECT COUNT(*)
				FROM exhibitors x
				WHERE x.project_uuid = e.project_uuid
				  AND x.event_uuid = e.event_uuid
				  AND x.deleted_at IS NULL
			) AS total_exhibitors,
			(
				SELECT COUNT(*)
				FROM conferences c
				WHERE c.project_uuid = e.project_uuid
				  AND c.event_uuid::text = e.event_uuid::text
				  AND c.status != 'cancelled'
			) AS total_conferences
		FROM events e
		WHERE e.project_uuid = ?
		  AND e.deleted_at IS NULL
		ORDER BY e.order_index ASC, e.event_uuid ASC
	`, projectUUID)
	return summaries, err
}
```

- [ ] **Step 6: Format and run focused backend tests**

Run:

```powershell
gofmt -w internal/domain/event/model.go internal/domain/event/service.go internal/domain/event/svc.go internal/domain/event/repo.go internal/domain/event/repo_test.go
go test ./internal/domain/event -run TestGetDashboardSummariesIntegration -v
```

Expected: `PASS`, or `SKIP` only when the integration database environment is
not configured.

- [ ] **Step 7: Commit the backend domain change**

```powershell
git add -- internal/domain/event/model.go internal/domain/event/service.go internal/domain/event/svc.go internal/domain/event/repo.go internal/domain/event/repo_test.go
git commit -m "feat(dashboard): add per-event summary query"
```

---

### Task 2: Expose Event Summaries from the Dashboard Handler

**Files:**

- Modify: `D:\Works\expoflow-service\internal\handler\admin\handler.go:480-584`

**Interfaces:**

- Consumes: `event.Service.GetDashboardSummaries`.
- Produces: top-level JSON property `event_summaries`.

- [ ] **Step 1: Add the response property**

Change `DashboardResponse` to:

```go
type DashboardResponse struct {
	Summary            DashboardSummary               `json:"summary"`
	RecentParticipants []DashboardRecentParticipant   `json:"recent_participants"`
	Conferences        []DashboardConference          `json:"conferences"`
	EventSummaries     []*event.DashboardEventSummary `json:"event_summaries"`
}
```

- [ ] **Step 2: Fetch summaries and fail on an inaccurate result**

After validating `projectUUID` in `getDashboard`, add:

```go
eventSummaries, err := h.eventSvc.GetDashboardSummaries(ctx, projectUUID)
if err != nil {
	_ = render.Render(w, r, shared.ErrInternalServer(err))
	return
}
```

Add the field to the final response:

```go
resp := DashboardResponse{
	Summary:            summary,
	RecentParticipants: recentParticipants,
	Conferences:        conferences,
	EventSummaries:     eventSummaries,
}
```

- [ ] **Step 3: Format and verify the backend contract compiles**

Run:

```powershell
gofmt -w internal/handler/admin/handler.go
go test ./internal/domain/event ./internal/handler/admin
go test ./internal/server ./internal/adapter
```

Expected: all packages report `ok` or `[no test files]`.

- [ ] **Step 4: Commit the backend handler change**

```powershell
git add -- internal/handler/admin/handler.go
git commit -m "feat(dashboard): expose event summaries"
```

---

### Task 3: Normalize Event Summaries in the Frontend Action

**Files:**

- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\actions\dashboard.ts`
- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\__tests__\actions\dashboard.test.ts`

**Interfaces:**

- Consumes: backend `event_summaries`.
- Produces: `DashboardData.event_summaries: DashboardEventSummary[]`.

- [ ] **Step 1: Update the action test first**

In the successful mock response and expected result, add:

```ts
event_summaries: [
  {
    event_uuid: 'event-a',
    event_code: 'EVENT_A',
    event_name: 'Event A',
    is_active: true,
    total_participants: 200,
    total_exhibitors: 90,
    total_conferences: 20,
  },
],
```

Also update the expected `summary` with the existing normalized fields so the
pre-existing stale assertion becomes accurate:

```ts
exhibitors_printed_count: 0,
exhibitors_not_printed_count: 0,
registrations_printed_count: 0,
registrations_not_printed_count: 0,
```

Add a test for an older backend response:

```ts
it('should default event summaries to an empty array', async () => {
  mockCookies.mockResolvedValue({
    get: jest.fn((name: string) =>
      name === 'access_token' ? { value: 'token-123' } : undefined
    ),
  } as any)
  mockApiGet.mockResolvedValue({ data: { data: {} } })

  const result = await getDashboard('project-123')

  expect(result.success).toBe(true)
  expect(result.data?.event_summaries).toEqual([])
})
```

- [ ] **Step 2: Run the action test and verify it fails**

Run:

```powershell
npm test -- --runInBand src/__tests__/actions/dashboard.test.ts
```

Expected: failure because `event_summaries` is not preserved/defaulted yet.

- [ ] **Step 3: Add the shared TypeScript contract and mapping**

Add to `src/app/actions/dashboard.ts`:

```ts
export interface DashboardEventSummary {
  event_uuid: string
  event_code: string
  event_name: string
  is_active: boolean
  total_participants: number
  total_exhibitors: number
  total_conferences: number
}
```

Extend `DashboardData`:

```ts
export interface DashboardData {
  summary: DashboardSummary
  recent_participants: DashboardRecentParticipant[]
  conferences: DashboardConference[]
  event_summaries: DashboardEventSummary[]
}
```

Extend `fallbackData`:

```ts
event_summaries: rawData.event_summaries || [],
```

- [ ] **Step 4: Run the action test**

Run:

```powershell
npm test -- --runInBand src/__tests__/actions/dashboard.test.ts
```

Expected: all dashboard action tests pass.

- [ ] **Step 5: Commit the frontend contract**

```powershell
git add -- src/app/actions/dashboard.ts src/__tests__/actions/dashboard.test.ts
git commit -m "feat(dashboard): map event summaries"
```

---

### Task 4: Build the Shared Event Card Grid

**Files:**

- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\components\dashboard\event-summary-cards.tsx`
- Create: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\__tests__\components\dashboard\event-summary-cards.test.tsx`

**Interfaces:**

- Consumes: `{ events: DashboardEventSummary[] }`.
- Produces: shared `EventSummaryCards` server-compatible React component.

- [ ] **Step 1: Write the failing component tests**

Create `src/__tests__/components/dashboard/event-summary-cards.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { EventSummaryCards } from '@/components/dashboard/event-summary-cards'

describe('EventSummaryCards', () => {
  it('renders active and inactive event totals', () => {
    render(
      <EventSummaryCards
        events={[
          {
            event_uuid: 'a',
            event_code: 'EVENT_A',
            event_name: 'Event A',
            is_active: true,
            total_participants: 1200,
            total_exhibitors: 90,
            total_conferences: 20,
          },
          {
            event_uuid: 'b',
            event_code: 'EVENT_B',
            event_name: 'Event B',
            is_active: false,
            total_participants: 0,
            total_exhibitors: 0,
            total_conferences: 0,
          },
        ]}
      />
    )

    expect(screen.getByText('Event Overview')).toBeInTheDocument()
    expect(screen.getByText('Event A')).toBeInTheDocument()
    expect(screen.getByText('Event B')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('1,200')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(3)
  })

  it('renders an empty state', () => {
    render(<EventSummaryCards events={[]} />)

    expect(screen.getByText('No events available')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the component test and verify it fails**

Run:

```powershell
npm test -- --runInBand src/__tests__/components/dashboard/event-summary-cards.test.tsx
```

Expected: failure because the component module does not exist.

- [ ] **Step 3: Implement the minimal shared component**

Create `src/components/dashboard/event-summary-cards.tsx`:

```tsx
import { Building2, Calendar, Contact } from 'lucide-react'
import type { DashboardEventSummary } from '@/app/actions/dashboard'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = {
  events: DashboardEventSummary[]
}

const metrics = [
  ['total_participants', 'Participants', Contact],
  ['total_exhibitors', 'Exhibitors', Building2],
  ['total_conferences', 'Conferences', Calendar],
] as const

export function EventSummaryCards({ events }: Props) {
  return (
    <section className="space-y-4" aria-labelledby="event-overview-title">
      <div>
        <h3 id="event-overview-title" className="text-lg font-bold">
          Event Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          Participant, exhibitor, and conference totals by event
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="border-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No events available
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.event_uuid} className="border-none">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {event.event_name}
                  </CardTitle>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {event.event_code}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    event.is_active
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-muted-foreground/20 text-muted-foreground'
                  }
                >
                  {event.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {metrics.map(([field, label, Icon]) => (
                  <div
                    key={field}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                      <Icon className="size-3" />
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold tracking-tight">
                      {event[field].toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run the component test**

Run:

```powershell
npm test -- --runInBand src/__tests__/components/dashboard/event-summary-cards.test.tsx
```

Expected: both tests pass.

- [ ] **Step 5: Commit the shared component**

```powershell
git add -- src/components/dashboard/event-summary-cards.tsx src/__tests__/components/dashboard/event-summary-cards.test.tsx
git commit -m "feat(dashboard): add event summary cards"
```

---

### Task 5: Render the Grid on Admin and Organizer Dashboards

**Files:**

- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\admin\(dashboard)\page.tsx`
- Modify: `C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\organizer\(dashboard)\page.tsx`

**Interfaces:**

- Consumes: `DashboardData.event_summaries`.
- Consumes: `EventSummaryCards`.

- [ ] **Step 1: Import the shared component on both pages**

Add:

```tsx
import { EventSummaryCards } from '@/components/dashboard/event-summary-cards'
```

- [ ] **Step 2: Render the approved section below the project totals**

Immediately after the closing tag of the four-card project metric grid on each
page, add:

```tsx
<EventSummaryCards events={result.data?.event_summaries || []} />
```

- [ ] **Step 3: Run focused frontend tests**

Run:

```powershell
npm test -- --runInBand src/__tests__/actions/dashboard.test.ts src/__tests__/components/dashboard/event-summary-cards.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Run full static verification**

Run:

```powershell
npx tsc --noEmit
npm test -- --runInBand
npm run build
```

Expected: TypeScript exits successfully, Jest reports all suites passing, and
Next.js completes a production build.

- [ ] **Step 5: Commit the dashboard integration**

```powershell
git add -- "src/app/admin/(dashboard)/page.tsx" "src/app/organizer/(dashboard)/page.tsx"
git commit -m "feat(dashboard): show event summaries"
```

---

### Task 6: Cross-Repository Final Verification

**Files:**

- Verify only; no new files.

**Interfaces:**

- Verifies the backend JSON contract matches the frontend TypeScript contract.

- [ ] **Step 1: Verify backend**

Run from `D:\Works\expoflow-service`:

```powershell
go test ./internal/domain/event ./internal/handler/admin ./internal/server ./internal/adapter
git status --short
```

Expected: tests pass. `git status --short` may still show the two pre-existing
`database/seeds/` changes, which must remain untouched.

- [ ] **Step 2: Verify frontend**

Run from `C:\Users\Mike\Desktop\Works\expo-flow-manage`:

```powershell
npm test -- --runInBand src/__tests__/actions/dashboard.test.ts src/__tests__/components/dashboard/event-summary-cards.test.tsx
npx tsc --noEmit
git status --short
```

Expected: tests and TypeScript pass. `.superpowers/` may remain untracked and
must not be included in feature commits.

- [ ] **Step 3: Compare the exact field names**

Run:

```powershell
rg -n "event_summaries|event_uuid|event_code|event_name|is_active|total_participants|total_exhibitors|total_conferences" D:\Works\expoflow-service\internal\handler\admin\handler.go D:\Works\expoflow-service\internal\domain\event C:\Users\Mike\Desktop\Works\expo-flow-manage\src\app\actions\dashboard.ts C:\Users\Mike\Desktop\Works\expo-flow-manage\src\components\dashboard\event-summary-cards.tsx
```

Expected: backend JSON tags and frontend property names match exactly.
