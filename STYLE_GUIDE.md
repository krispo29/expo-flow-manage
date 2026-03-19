# ExpoFlow Style Guide & UI Analysis

## 1. Design Concept: "Formal Elegance"
สไตล์การออกแบบของ ExpoFlow ถูกกำหนดให้มีความเป็นมืออาชีพ (Formal) แต่ยังคงความอบอุ่นและเข้าถึงง่าย (Elegant & Warm) ผ่านการใช้สีโทน Teal และ Warm Sand/Champagne ซึ่งให้ความรู้สึกถึงความน่าเชื่อถือและความลุ่มลึก

## 2. Color Palette
โปรเจคนี้มีการปรับแต่ง Color Variables ใน `src/app/globals.css` โดยใช้ Tailwind CSS 4 `@theme`:

- **Primary (Formal Teal):** `hsl(180 25% 25%)` เป็นสีหลักสำหรับ Header, Sidebar (Active) และปุ่มกดหลัก เพื่อความรู้สึกมั่นคง
- **Secondary (Warm Sand):** `hsl(38 30% 94%)` ใช้สำหรับ Background และองค์ประกอบที่ต้องการความนุ่มนวล
- **Accent (Deep Sand):** `hsl(38 25% 88%)` สำหรับ Interactive Elements
- **Background:** `hsl(180 20% 98.5%)` (Off-white Teal tint) เพื่อความสบายตา
- **Sidebar (Dark Teal):** `hsl(180 30% 12%)` เน้นความตัดกันอย่างชัดเจน ให้ Sidebar ดูโดดเด่นและเป็นระเบียบ

## 3. Typography
- **UI & Interface (Sans):** **Inter** ถูกเลือกใช้สำหรับข้อความทั่วไป เนื่องจากมีความอ่านง่าย (Readability) สูงในหน้าจอที่มีข้อมูลหนาแน่น
- **Headings & Branding:** **Montserrat** ถูกใช้สำหรับหัวข้อ (Titles) และส่วนที่เป็นชื่อแบรนด์ เพื่อเพิ่มความเป็นสากลและความทันสมัย

## 4. UI Components (shadcn/ui + Radix UI)
โปรเจคนี้ใช้งาน **shadcn/ui** เป็นพื้นฐาน โดยมีการปรับแต่งเพิ่มเติม:
- **Cards:** ใช้สำหรับจัดกลุ่มข้อมูลสถิติ (Metric Cards) มีการเพิ่ม Hover effect: `-translate-y-1` และ `shadow-md` เพื่อให้ UI ดู "มีชีวิต"
- **Badges:** ใช้สำหรับสถานะ (Status) หรือประเภทของคน (Attendee Types) เพื่อการจำแนกข้อมูลด้วยสายตาที่รวดเร็ว
- **Sidebar:** เป็นแบบ Multi-level (Collapsible) รองรับการแสดงผลโปรเจคและเมนูย่อยได้อย่างเป็นระเบียบ
- **Dashboard Charts:** ปรับแต่งสี Chart ให้เข้ากับธีมหลัก (Teal & Gold Palette) เพื่อความต่อเนื่องทางสายตา

## 5. User Experience (UX) Details
- **Responsive Design:** ใช้งาน `use-mobile` hook ในการปรับ Sidebar และ Layout ให้รองรับทั้ง Desktop และ Tablet
- **Interactive Feedback:**
  - ใช้งาน **Sonner** สำหรับการแจ้งเตือน (Toast Notifications) ที่มีสีสันตามประเภทเหตุการณ์ (Rich Colors)
  - มี **Loading Skeleton** ในส่วนสำคัญของหน้า Dashboard เพื่อลดความรู้สึกรอนานของผู้ใช้
  - มีการใช้งาน **Command Palette** (`cmdk`) เพื่อความรวดเร็วในการค้นหาและใช้งานฟีเจอร์สำหรับ Power Users
- **Visual Cues:** ใช้งาน Icon จาก **Lucide React** เพื่อสื่อความหมายโดยไม่ต้องอ่านข้อความ (เช่น MapPin สำหรับสถานที่, Clock สำหรับเวลา)

## 6. Styling Approach
- **Tailwind CSS 4:** ใช้ระบบการตั้งค่าธีมแบบใหม่ (Inline Theme CSS) ทำให้การปรับแต่งสีและ Radius ทำได้ง่ายและรวมศูนย์
- **Transitions & Animations:** ใช้งาน `tw-animate-css` และ Tailwind transitions เพื่อให้การเปลี่ยนสถานะ (เช่น Hover หรือ Sidebar Toggle) ดูลื่นไหล
- **Dark Mode Support:** รองรับการสลับธีม (Light/Dark) โดยที่ยังคงความอ่านง่ายและรักษาความสวยงามของคู่สี Teal/Sand ไว้ได้เป็นอย่างดี
