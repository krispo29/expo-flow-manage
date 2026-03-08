# คู่มือการอัพเดทโค้ดจาก Main ไป Staging และ Deploy Preview

เอกสารนี้อธิบายขั้นตอนการนำโค้ดล่าสุดจาก branch `main` ไปรวมกับ `staging` และเพื่อ deploy ทดสอบระบบ (Preview) บน Vercel หรือโฮสติ้งอื่นๆ

## ขั้นตอนที่ 1: ตรวจสอบและดึงโค้ดล่าสุดจาก Main

สิ่งแรกที่ต้องทำคือทำให้แน่ใจว่าเครื่องของเรามีโค้ดล่าสุดจาก branch `main` จริงๆ

1. เปิด Terminal หรือ Command Prompt
2. สลับไปที่ branch `main`

```bash
git checkout main
```

3. ดึงอัพเดทล่าสุดจาก Remote GitHub

```bash
git pull origin main
```

## ขั้นตอนที่ 2: สลับไปยังโหมด Staging

เปลี่ยนไปทำงานบน branch สำหรับการทดสอบนั่นคือ `staging`

1. สลับไป branch `staging`

```bash
git checkout staging
```

2. ดึงอัพเดทล่าสุดของ `staging` เพื่อป้องกันปัญหา Conflict ระหว่างหลายอุปกรณ์

```bash
git pull origin staging
```

## ขั้นตอนที่ 3: นำโค้ดเข้าหากัน (Merge)

นำโค้ดที่อัพเดทล่าสุดบน `main` มารวมกันกับ `staging`

1. นำ `main` มารวมใน `staging`

```bash
git merge main
```

_หมายเหตุ: หากเกิดข้อขัดแย้ง (Merge Conflict) ในขั้นตอนนี้จะต้องทำการแก้ไขใน Code Editor ให้เรียบร้อย แล้วจึงคอมมิต (Commit) ก่อนทำขั้นต่อไป_

## ขั้นตอนที่ 4: เผยแพร่ไปยัง Remote และ Deploy Preview

เมื่อโค้ดรวมกันเสร็จแล้ว สามารถผลักดันขึ้นไปบน Remote เพื่อกระตุ้น Auto Deploy หรือจะสั่งด้วย CLI ก็ได้

1. ส่งขึ้นเซิร์ฟเวอร์

```bash
git push origin staging
```

> [!TIP]
> **การ Deploy บน Vercel อัตโนมัติ:**
> สำหรับโปรเจกต์เว็บแอปพลิเคชันส่วนใหญ่ที่เชื่อมต่อกับ GitHub ผ่าน Vercel, Netlify หรือระบบอื่นๆ การที่เราใช้คำสั่ง `git push origin staging` จะเป็นการกระตุ้น (Trigger) การสร้าง **Preview Deployment** โดยอัตโนมัติบน Vercel ทันที คุณสามารถเข้าไปดูลิงก์สำหรับการเทส (Preview URL) ได้ผ่านแดชบอร์ดของ Vercel หรือในหน้า Pull Request บน GitHub ของคุณ

### (ทางเลือก) หากต้องการ Deploy แบบ Manual ผ่าน Vercel CLI

หากไม่ได้เชื่อมต่อ GitHub กับ Vercel ไว้ หรือต้องการสั่ง Deploy ด้วยตัวเองผ่าน Terminal สามารถทำด้วย Vercel CLI:

1. ติดตั้ง Vercel CLI (ครั้งแรกครั้งเดียว): `npm i -g vercel`
2. ล็อคอิน (หากยังไม่ได้ล็อคอิน): `vercel login`
3. พิมพ์สั่ง Deploy:

```bash
vercel
```

_การใช้คำสั่ง `vercel` เดี่ยวๆ จะเป็นการ Deploy ขึ้น Environment แบบ Preview อัตโนมัติ (หากต้องการขึ้น Production จะใช้ `vercel --prod`)_

## สรุป (แบบรวบรัดในบรรทัดเดียว)

สำหรับผู้ที่คล่องแคล่ว สามารถรันเซ็ตนี้ได้เลยแบบรวดเดียวบน Terminal:

```bash
git checkout main && git pull origin main && git checkout staging && git pull origin staging && git merge main && git push origin staging && git checkout main
```

_(คำสั่งสุดท้ายคืนกลับมาที่ main เพื่อทำงานปกติต่อ)_
