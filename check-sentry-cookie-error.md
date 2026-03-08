# การตรวจสอบและแก้ไข Error: Server Components render (Cookie Modification)

ไฟล์นี้จะอธิบายสาเหตุ วิธีค้นหา รวมถึงวิธีแก้ไขปัญหา Error ยอดฮิตใน Next.js (App Router) ที่มักพบตามแจ้งเตือนของระบบแบบ Sentry:

**Error Statement ที่พบได้บ่อย:**
`Error: An error occurred in the Server Components render. The specific message is omitted in production builds...`

---

## 🛑 สาเหตุของปัญหา (Root Cause)

ปัญหานี้มักจะเกิดเมื่อเราพยายาม **Set** หรือ **Delete** Cookies ในโค้ด Server Action หรือ API Utils (เช่น ใช้คำสั่ง `cookies().delete('token')`) **ในขณะที่ Server Component กำลัง Render เนื้อหาของหน้าเว็บ (Render Phase)**

ระบบการ Render ของ Next.js **ไม่อนุญาต** ให้แก้ไขข้อมูล Response Headers (ซึ่งรวมถึงคำสั่งลบ/สร้าง Cookies) ในขณะที่กำลังทำการสตรีมมิ่ง/ส่ง HTML ของหน้าตาเว็บกลับมาให้ Client (พูดง่ายๆ คือ มันเริ่มประกอบหน้าเว็บแล้ว กลับไปแก้หัว Header หรือ Cookie ไม่ได้แล้ว จึงเกิดการโยน Error จนหน้าเว็บพัง)

---

## 🔍 วิธีตรวจสอบหาจุดที่เกิดในโปรเจกต์อื่น (How to Check)

คุณสามารถค้นหาจุดที่อาจเป็นต้นเหตุของปัญหาในโปรเจกต์ Next.js ของคุณด้วยคำสั่ง หรือ Global Search (Ctrl+Shift+F) เหล่านี้ตามโฟลเดอร์หลักอย่าง `src/app/actions`:

1. ให้ค้นหาการใช้งานฟังก์ชันการจัดการ Cookie
   - `cookieStore.delete(`
   - `cookies().delete(`
   - `cookies().set(`

2. สังเกตว่าโค้ดบรรทัดนั้นถูกเขียนในฟังก์ชันประเภท **ใช้สำหรับตอนโหลด Data มาทำหน้าเว็บ** หรือไม่ (เช่น โค้ดที่เรียกตอนเข้าหน้าเว็บครั้งแรก ดึงข้อมูลมาใส่ Table, List) โค้ดที่กำลัง Render อยู่หน้า `layout.tsx` หรือ `page.tsx`

   _ตัวอย่างจุดที่เป็นจุดเสี่ยง / โค้ดผิดพลาด:_

   ```typescript
   // actions/getData.ts
   import { cookies } from 'next/headers'

   export async function getMyData() {
     try {
       // ถ้าเรียก API ปกติผ่าน...
     } catch (error) {
       if (error.response.status === 401) {
         // ❌ พังแน่นอน ถ้าฟังก์ชัน getMyData ถูกเรียกตอนโชว์หน้าจอครั้งแรก (Server Component / layout.tsx / page.tsx)
         const cookieStore = await cookies()
         cookieStore.delete('access_token')
       }
     }
   }
   ```

---

## ✅ วิธีแก้ไขที่ถูกต้อง (How to Fix)

วิธีที่ถูกต้องคือการเปลี่ยนกระบวนการจากการให้ **Server เคลียร์ Cookie เองแบบดื้อๆ** มาเป็น **การคืนค่าไปบอกตัว Component ให้ช่วย Redirect ออกไป หรือโยน Error ให้ Error Boundary** แล้วค่อยไปเคลียร์ state กันที่หน้าปลายทาง (อย่าง `/login`)

### Step 1: ลบคำสั่งจัดการ Cookie ออกจากฟังก์ชัน `get` Data

ให้เปลี่ยนไปรับและคืนค่าตัวแปร Error กลับไปแทน

```diff
  export async function getMyData() {
    try {
      // ...
    } catch (error) {
      if (isTokenExpired(error)) {
-       const cookieStore = await cookies();
-       cookieStore.delete('access_token'); // เอาออก ห้ามทำตรงนี้
+       // ✅ คืนค่าออกมาเป็นบอกว่า "token ผิดพลาดนะ"
+       return { success: false, error: 'key incorrect' };
      }
    }
  }
```

### Step 2: ให้หน้า Layout หรือ Page ตรวจสอบแล้วสั่ง Redirect

ฝั่งหน้าจอ (UI Component) เมื่อรับค่ามาจาก API Action ว่ามี Error Token ให้สั่ง `redirect()` ของ Next.js ซึ่งเป็นการทำงานที่เหมาะสมในช่วง Render Phase ได้อย่างปลอดภัย

```typescript
// app/admin/layout.tsx หรือ page.tsx
import { redirect } from 'next/navigation';
import { getMyData } from '@/app/actions/getData';

export default async function AdminLayout({ children }) {
  const result = await getMyData();

  // ✅ ตรวจสอบและ สั่ง Redirect กลับไปได้อย่างปลอดภัย
  if (!result.success && result.error === 'key incorrect') {
    redirect('/login');
  }

  return <div>{children}</div>;
}
```

### Step 3: สั่ง Clear อาการตกค้างที่หน้า Login ฝั่ง Client

เมื่อผู้ใช้ร่วงมาที่หน้าตายตัวอย่าง `/login` ให้หน้า `/login` นั้นทำการรับบทบาทเคลียร์ข้อมูลเก่าๆ ออกให้หมด (Clear Zustand, Local Storage)

```typescript
// app/login/page.tsx
'use client'

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore'; // หรือถ้าไม่ได้ใช้ zustand ก็เคลียร์ localstorage ทั่วไป

export default function LoginPage() {
  const logout = useAuthStore((state) => state.logout);

  // ✅ เมื่อหน้า Login โหลดขึ้นมา ให้มันทำการรีเซ็ตทุกอย่างเสมอ เป็นการการันตีให้สะอาด
  useEffect(() => {
    logout();
  }, [logout]);

  return (
    // ... UI Form Login ...
  )
}
```

### สรุปย่อ:

- **ห้าม** สั่ง `.set()` หรือ `.delete()` cookies ภายในฟังก์ชันใดๆ ก็ตามที่ผูกกับการ Render HTML (ใน layout, page ที่เรียกมาจาก Server ขาแรก)
- ให้สั่งค่าตัวแปร Error ออกไปหา UI Component แล้วตัวนั้น **`redirect()`** แทน
- สุดท้ายหน้าที่รับจบคือ **หน้าปลายทาง (Login)** จะเช็ดล้างเคลียร์ State ทุกอย่างออกเอง (Local Storage, Auth Store)
