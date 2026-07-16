# Business Matching: เปิดใช้งานอีกครั้ง

Business Matching ถูกปิดชั่วคราว เพราะ production backend ยังไม่มี API ครบ

## เปิดใช้งาน

แก้ค่าใน `src/lib/features.ts`:

```ts
export const businessMatchingEnabled = true
```

จากนั้น deploy frontend ตามปกติ

## Backend ที่ต้องพร้อม

- `GET /v1/admin/project/exhibitors/business-matching/categories`
- `GET /v1/organizer/exhibitors/business-matching/categories`
- `GET /v1/admin/project/business-matching/category-requests`
- `POST /v1/admin/project/business-matching/category-requests/{requestUuid}/approve`
- `POST /v1/admin/project/business-matching/category-requests/{requestUuid}/reject`
- `POST /v1/organizer/exhibitors/send_pending_business_matching_ready_emails`

## ตรวจสอบหลังเปิด

1. Admin เห็นเมนู Matching Categories และเปิดหน้าได้โดยไม่มี 404
2. Admin/Organizer เปิด Exhibitor form แล้วเลือก category ได้
3. Organizer เห็นปุ่ม Send Business Matching Ready และส่งอีเมลได้
