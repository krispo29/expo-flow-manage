# Organizer Quota Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Organizers open and process Quota Requests using the existing project-scoped API.

**Architecture:** Re-export the existing client page at the Organizer route so both roles use the same UI and server actions. Expand only the sidebar visibility predicate; the server actions continue calling `/v1/admin/project/quota-requests`, which accepts an authenticated Organizer token and scopes data through the supplied project context.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest.

## Global Constraints

- Do not change `D:\Works\expoflow-service`; reuse its existing Quota Requests endpoints.
- Preserve Admin behavior and the existing `projectId` query parameter.
- Do not add dependencies or duplicate the Quota Requests component.

---

### Task 1: Expose the shared Quota Requests UI to Organizers

**Files:**
- Create: `src/app/organizer/(dashboard)/quota-requests/page.tsx`
- Modify: `src/components/app-sidebar.tsx:349-362`

**Interfaces:**
- Consumes: the default export from `@/app/admin/(dashboard)/quota-requests/page` and `user.role` from `useAuthStore`.
- Produces: `/organizer/quota-requests` and a visible `Quota Requests` sidebar item for both `ADMIN` and `ORGANIZER`.

- [ ] **Step 1: Add the Organizer route as a direct re-export**

```tsx
export { default } from '@/app/admin/(dashboard)/quota-requests/page'
```

- [ ] **Step 2: Expand the existing sidebar role guard**

```tsx
{(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
```

- [ ] **Step 3: Verify the production build**

Run: `npm run build`

Expected: exits with code `0`, including both `/admin/quota-requests` and `/organizer/quota-requests` routes.

- [ ] **Step 4: Commit**

```bash
git add -- src/components/app-sidebar.tsx "src/app/organizer/(dashboard)/quota-requests/page.tsx"
git commit -m "feat: show quota requests to organizers"
```

## Self-Review

- Spec coverage: Task 1 adds the Organizer route, enables its sidebar item, and retains existing endpoint behavior.
- Placeholder scan: no implementation placeholders.
- Type consistency: the route reuses the existing default page export without introducing a new interface.
