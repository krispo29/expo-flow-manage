# Token Expiration Handling Guide

> คู่มือระบบตรวจจับ Token หมดอายุอัตโนมัติสำหรับ Next.js + Axios + Server Actions
> ใช้เป็น reference สำหรับโปรเจคอื่นได้เลย

---

## สารบัญ

1. [ปัญหาเดิม](#1-ปัญหาเดิม)
2. [สถาปัตยกรรม Auth ของโปรเจค](#2-สถาปัตยกรรม-auth-ของโปรเจค)
3. [แนวทางแก้ไข](#3-แนวทางแก้ไข)
4. [ไฟล์ที่เกี่ยวข้อง + โค้ดเต็ม](#4-ไฟล์ที่เกี่ยวข้อง--โค้ดเต็ม)
5. [Checklist สำหรับเช็คโปรเจคอื่น](#5-checklist-สำหรับเช็คโปรเจคอื่น)

---

## 1. ปัญหาเดิม

เมื่อ `access_token` (JWT) หมดอายุ:

- Backend ตอบกลับ `{ code: 400, message: "key incorrect" }`
- Frontend ไม่ได้จัดการ error นี้ → แสดงหน้าพัง (error page)
- User ต้อง **ลบ localStorage ด้วยตัวเอง** แล้ว login ใหม่

### สาเหตุ

แอปเก็บ auth ไว้ **2 ที่** แต่ไม่มีการ sync กัน:

| ที่เก็บ                              | ข้อมูล                                    | ใช้ที่ไหน                           |
| ------------------------------------ | ----------------------------------------- | ----------------------------------- |
| **httpOnly Cookie** (`access_token`) | JWT token สำหรับเรียก API                 | Server Actions (server-side)        |
| **localStorage** (`auth-storage`)    | Zustand state (`isAuthenticated`, `user`) | `AuthGuard` component (client-side) |

เมื่อ token หมดอายุ:

- Cookie ยังอยู่ (ยังไม่หมดอายุตาม `maxAge`)
- localStorage ยังบอกว่า `isAuthenticated = true`
- Server action ส่ง token เก่าไป API → ได้ error กลับมา
- **ไม่มีใครลบ cookie หรือ update localStorage**

---

## 2. สถาปัตยกรรม Auth ของโปรเจค

### Flow ตอน Login

```
User กรอก username/password
        ↓
LoginPage (client) → loginAction() (server action)
        ↓
Server action POST /auth/c/signin
        ↓
API ตอบ { access_token, uuid, com_uuid }
        ↓
เก็บ access_token ใน httpOnly cookie (server-side)
เก็บ user_role ใน httpOnly cookie (server-side)
        ↓
Return ไป client → Zustand store.login(user)
        ↓
Zustand persist ลง localStorage (client-side)
```

### Flow ตอนเข้าหน้า Dashboard

```
User เข้า /admin/projects
        ↓
admin/layout.tsx → AuthGuard (client)
  - เช็ค Zustand isAuthenticated
  - ถ้า false → redirect /login
  - ถ้า true → render children
        ↓
(dashboard)/layout.tsx (server component)
  - getUserRole() → อ่าน cookie user_role
  - getProjects() → อ่าน cookie access_token → เรียก API
        ↓
ถ้า token หมดอายุ → API ตอบ 400 "key incorrect"
        ↓
❌ เดิม: แสดง error (ไม่ redirect)
✅ ใหม่: ลบ cookies + redirect ไป /login
```

---

## 3. แนวทางแก้ไข

### 3.1 สร้าง Utility ตรวจจับ Token Error

สร้างฟังก์ชัน `isTokenExpiredError()` ที่ตรวจจับ:

- **400** + message `"key incorrect"` → backend บอกว่า token ไม่ถูกต้อง
- **401 Unauthorized** → token หมดอายุปกติ

```typescript
// src/lib/auth-helpers.ts

import { AxiosError } from 'axios'

export function isTokenExpiredError(
  error: AxiosError<{ message?: string }>
): boolean {
  if (!error?.response) return false

  const status = error.response.status
  const message = error.response.data?.message

  if (status === 400 && message === 'key incorrect') return true
  if (status === 401) return true

  return false
}
```

> **สำคัญ:** ไฟล์นี้ **ห้ามใส่ `'use server'`** เพราะ Next.js บังคับว่า server action ต้องเป็น `async` function เท่านั้น ถ้าใส่ `'use server'` แล้ว export ฟังก์ชันที่ไม่ใช่ async จะ compile error

### 3.2 ลบ Cookies ตอน Catch Error (Server Action)

ใน server action ที่เรียก API แต่ละตัว เพิ่ม logic ใน `catch` block:

```typescript
// ตัวอย่างใน src/app/actions/project.ts

import { isTokenExpiredError } from '@/lib/auth-helpers'

export async function getProjects() {
  try {
    // ... เรียก API ปกติ
  } catch (error: any) {
    // ถ้า token หมดอายุ → ลบ cookies ทั้งหมด
    if (isTokenExpiredError(error)) {
      const cookieStore = await cookies()
      cookieStore.delete('access_token')
      cookieStore.delete('project_uuid')
      cookieStore.delete('user_role')
    }

    const errorMessage = error.response?.data?.message || error.message
    return { success: false, error: errorMessage, projects: [] }
  }
}
```

### 3.3 Redirect ไป Login ใน Layout (Server Component)

ใน server component layout ที่เรียก server action ตรวจผลลัพธ์:

```tsx
// src/app/admin/(dashboard)/layout.tsx

import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  if (userRole !== 'ORGANIZER') {
    const result = await getProjects()

    // ✅ ถ้า token หมดอายุ → redirect ไป login
    if (!result.success && result.error === 'key incorrect') {
      redirect('/login')
    }

    // ... ใช้ result.projects ต่อ
  }
}
```

### 3.4 Client-side Auth Error Handler

สร้าง component ที่ listen custom event `auth:expired` เผื่อต้อง clear Zustand store ด้วย:

```tsx
// src/components/auth-error-handler.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthErrorHandler() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    const handleAuthExpired = () => {
      logout() // ลบ Zustand state + localStorage
      router.push('/login') // redirect ไป login
    }

    globalThis.addEventListener('auth:expired', handleAuthExpired)
    return () =>
      globalThis.removeEventListener('auth:expired', handleAuthExpired)
  }, [logout, router])

  return null
}
```

ใส่ใน admin layout:

```tsx
// src/app/admin/layout.tsx

import { AuthGuard } from '@/components/auth-guard'
import { AuthErrorHandler } from '@/components/auth-error-handler'

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <AuthErrorHandler />
      {children}
    </AuthGuard>
  )
}
```

---

## 4. ไฟล์ที่เกี่ยวข้อง + โค้ดเต็ม

### ไฟล์ใหม่

| ไฟล์                                    | หน้าที่                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `src/lib/auth-helpers.ts`               | ฟังก์ชัน `isTokenExpiredError()` — ตรวจจับว่า API error เป็น token หมดอายุหรือไม่ |
| `src/components/auth-error-handler.tsx` | Client component — listen event `auth:expired` แล้ว clear Zustand + redirect      |

### ไฟล์ที่แก้ไข

| ไฟล์                                   | สิ่งที่เปลี่ยน                                                              |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `src/app/actions/project.ts`           | เพิ่ม `isTokenExpiredError()` check ใน catch → ลบ cookies ถ้า token หมดอายุ |
| `src/app/admin/(dashboard)/layout.tsx` | เช็คผล `getProjects()` ถ้า error "key incorrect" → `redirect('/login')`     |
| `src/app/admin/layout.tsx`             | เพิ่ม `<AuthErrorHandler />` component                                      |

### Diagram รวม

```
┌─────────────────────────────────────────────────────────┐
│  Client (Browser)                                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────┐            │
│  │  AuthGuard    │    │  AuthErrorHandler     │           │
│  │  (Zustand)    │    │  listen auth:expired  │           │
│  │  ↓ redirect   │    │  → logout() + redirect│           │
│  │  if !auth     │    │                       │           │
│  └──────────────┘    └──────────────────────┘            │
│          ↓                                                │
├─────────────────────────────────────────────────────────┤
│  Server (Next.js Server Components + Server Actions)     │
│                                                          │
│  ┌──────────────────────────┐                            │
│  │  (dashboard)/layout.tsx   │                            │
│  │  ↓                        │                            │
│  │  getProjects()            │                            │
│  │  ↓                        │                            │
│  │  error "key incorrect"?   │                            │
│  │  YES → redirect('/login') │                            │
│  └──────────────────────────┘                            │
│          ↓                                                │
│  ┌──────────────────────────┐                            │
│  │  project.ts (catch block) │                            │
│  │  ↓                        │                            │
│  │  isTokenExpiredError()?   │                            │
│  │  YES → delete cookies     │                            │
│  └──────────────────────────┘                            │
│          ↓                                                │
│  ┌──────────────────────────┐                            │
│  │  auth-helpers.ts          │                            │
│  │  isTokenExpiredError()    │                            │
│  │  - 400 "key incorrect"   │                            │
│  │  - 401 Unauthorized      │                            │
│  └──────────────────────────┘                            │
│          ↓                                                │
├─────────────────────────────────────────────────────────┤
│  Backend API                                             │
│  token หมดอายุ → ตอบ 400 { message: "key incorrect" }    │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Checklist สำหรับเช็คโปรเจคอื่น

ใช้ checklist นี้ตรวจสอบว่าโปรเจคมีระบบจัดการ token หมดอายุหรือยัง:

### Auth Storage

- [ ] ตรวจว่า token เก็บที่ไหน? (cookie / localStorage / memory)
- [ ] ถ้าเก็บ 2 ที่ (cookie + localStorage) มี sync logic หรือไม่?
- [ ] Cookie `maxAge` ตรงกับ `expires_in` จาก API หรือไม่?

### Token Expiration Detection

- [ ] มีฟังก์ชันตรวจจับ token error หรือไม่? (เช่น `isTokenExpiredError()`)
- [ ] ตรวจจับ status code อะไรบ้าง? (ปกติ: 401, บาง backend: 400 + message specific)
- [ ] API interceptor (Axios/Fetch) มี handle auth error หรือไม่?

### Cookie Cleanup

- [ ] เมื่อเจอ token error → ลบ cookies อัตโนมัติหรือไม่?
- [ ] ลบครบทุก auth-related cookies หรือไม่? (`access_token`, `user_role`, `project_uuid`, etc.)

### Redirect to Login

- [ ] Server component: มี redirect ไป `/login` เมื่อ token หมดอายุหรือไม่?
- [ ] Client component: มี clear Zustand/Redux state + redirect หรือไม่?
- [ ] Middleware: มี middleware ตรวจสอบ token ทุก request หรือไม่? (optional แต่แนะนำ)

### Error UX

- [ ] User เห็น error page หรือ redirect ไป login?
- [ ] มี toast/notification บอก user ว่า session หมดอายุหรือไม่? (nice-to-have)

### ⚠️ ข้อควรระวัง Next.js

- **`'use server'` file**: ห้าม export ฟังก์ชันที่ไม่ใช่ `async` → compile error  
  → ถ้าเป็น utility function ปกติ (เช่น `isTokenExpiredError`) **อย่าใส่ `'use server'`**
- **`redirect()` ใน server component**: ใช้ `import { redirect } from 'next/navigation'` จะ throw internally (ห้ามอยู่ใน try-catch)
- **`globalThis` vs `window`**: ESLint บางโปรเจคบังคับใช้ `globalThis` แทน `window`

---

## สรุป

| ขั้นตอน | ทำอะไร                           | ที่ไหน                                      |
| ------- | -------------------------------- | ------------------------------------------- |
| 1       | สร้างฟังก์ชันตรวจจับ token error | `src/lib/auth-helpers.ts`                   |
| 2       | ลบ cookies ใน catch block        | Server Actions (เช่น `project.ts`)          |
| 3       | Redirect ไป login ใน layout      | Server Component (`layout.tsx`)             |
| 4       | Clear client state               | Client Component (`auth-error-handler.tsx`) |
| 5       | ใส่ handler ใน admin layout      | `src/app/admin/layout.tsx`                  |
