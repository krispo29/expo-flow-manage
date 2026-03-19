responsive เต็มรูปแบบ โดยมีเงื่อนไขดังนี้:

**Layout & Breakpoints:**

- Mobile: < 768px → single column, hamburger menu
- Tablet: 768px–1024px → 2 columns, compact nav
- Desktop: > 1024px → full layout, horizontal nav

**เทคโนโลยี:**

- ใช้ [Nextjs + Tailwind CSS]
- CSS: ใช้ mobile-first (min-width) ไม่ใช่ max-width
- ห้ามใช้ fixed width เป็น px สำหรับ container หลัก

**เนื้อหาในหน้า:**

- [ระบุ section ที่ต้องการ เช่น Hero, Features, Pricing, Footer]

**UI/UX:**

- Font ต้องอ่านง่ายบน mobile (min 16px)
- ปุ่มและ touch target ต้องใหญ่พอสำหรับนิ้วมือ (min 44x44px)
- รูปภาพใช้ max-width: 100% ทุกรูป

**Accessibility:**

- ใส่ alt text ให้รูปภาพ
- ใช้ semantic HTML (header, main, section, footer)
- Color contrast ผ่านมาตรฐาน WCAG AA
