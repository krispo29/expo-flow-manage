# ExpoFlow Project Analysis

## 1. Project Overview
**ExpoFlow** เป็นแพลตฟอร์มบริหารจัดการงานนิทรรศการและสัมมนา (Event Management Platform) ที่ออกแบบมาเพื่อรองรับการทำงานของทั้งผู้ดูแลระบบ (Admin) และผู้จัดงาน (Organizer) โดยเน้นความลื่นไหลในการจัดการข้อมูลผู้ลงทะเบียน (Participants), ผู้ออกบูธ (Exhibitors) และการสัมมนา (Conferences)

## 2. Technical Stack
### Core Framework
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Runtime:** React 19

### State Management & Data Fetching
- **Client State:** Zustand (`src/store/useAuthStore.ts`)
- **Data Fetching:** Server Actions (`src/app/actions/*`) - เน้นการทำงานแบบ Server-side rendering เพื่อประสิทธิภาพและความปลอดภัย
- **API Interaction:** Axios (สำหรับเชื่อมต่อกับ Backend API ภายนอก)

### Security & Optimization
- **Authentication:** Cookie-based Authentication (HTTP-only, Secure, SameSite: Strict)
- **Authorization:** Role-Based Access Control (RBAC) แบ่งระดับ ADMIN และ ORGANIZER
- **Rate Limiting:** Upstash Redis สำหรับป้องกันการ Brute-force และ API Overuse
- **Error Tracking:** Sentry Integration

### Specialized Features
- **Data Export/Import:** `xlsx` library สำหรับจัดการไฟล์ Excel
- **Badge Printing:** `react-to-print` และ `qrcode.react` สำหรับพิมพ์ป้ายชื่อหน้างาน
- **Charts:** Recharts สำหรับ Dashboard สถิติ

## 3. Directory Structure & Architecture
- `src/app`: ประกอบด้วย Routes หลัก แบ่งเป็นกลุ่ม Admin และ Organizer
- `src/app/actions`: ส่วนหัวใจของการจัดการข้อมูล (Server Actions) แยกตาม Module เช่น `auth`, `conference`, `participant`
- `src/components`:
  - `ui/`: Shared components จาก shadcn/ui
  - `dashboard/`: Components เฉพาะสำหรับส่วนแสดงผลสถิติ
  - บิซิเนสคอมโพเนนต์: `badge-print.tsx`, `staff-management.tsx`, `conference-form.tsx`
- `src/lib`: ส่วน Utility เช่น การตั้งค่า API, การตรวจสอบสิทธิ์ (Authorization), และ Validation schemas (Zod)
- `src/__tests__`: การทำ Automated Testing ครอบคลุมทั้ง Logic และ Components

## 4. Key Workflows
1. **Authentication:** ใช้ Server Actions ในการ Login และเก็บ Session ใน HTTP-only Cookies
2. **Dashboard:** รวมศูนย์ข้อมูลสำคัญ (Exhibitors, Participants, Rooms) มาแสดงผลผ่าน Cards และ Charts ในหน้าเดียว
3. **Registration & Printing:** ระบบรองรับการเพิ่มผู้ลงทะเบียนใหม่และสามารถพิมพ์ Badge (พร้อม QR Code) ได้ทันที
4. **Importing:** มีระบบ Excel Import เพื่อความรวดเร็วในการนำเข้าข้อมูลจำนวนมาก

## 5. Development Standards
- **Testing:** ใช้ Jest และ React Testing Library
- **Linting & Formatting:** ESLint และ Prettier (พร้อม tailwindcss-plugin)
- **Type Safety:** ใช้งาน TypeScript อย่างเข้มข้น ร่วมกับ Zod สำหรับ Schema Validation
