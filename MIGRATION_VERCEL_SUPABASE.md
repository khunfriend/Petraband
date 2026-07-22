# แผนการย้ายระบบไปยัง Vercel + Supabase

**วันที่จัดทำ:** 22 กรกฎาคม 2569
**สถานะปัจจุบัน:** Self-hosted Docker (Postgres 16 + Next.js standalone)
**เป้าหมาย:** Vercel (hosting) + Supabase (Postgres + Storage)

---

## 1. สรุปสถาปัตยกรรม

### ปัจจุบัน (Self-hosted)
| Component | Stack |
|---|---|
| Runtime | Docker: `postgres:16-alpine` + Next.js standalone |
| Database | Postgres ใน container (port 5434) |
| File Storage | Local disk: `frontend/public/uploads/avatars/` |
| Email | Resend |
| Auth | NextAuth 5 (Credentials) |

### หลังย้าย (Vercel + Supabase)
| Component | Stack |
|---|---|
| Runtime | Vercel Serverless / Edge (Node runtime) |
| Database | Supabase Postgres (managed) + PgBouncer pooling |
| File Storage | Supabase Storage (S3-compatible) |
| Email | Resend (คงเดิม) |
| Auth | NextAuth 5 คงเดิม (ไม่ใช้ Supabase Auth) |

---

## 2. งานที่ต้องแก้โค้ด (Blocking Issues)

### 2.1 Avatar Upload — ต้องเปลี่ยนที่เก็บไฟล์ ⚠️ **BLOCKER**

**ปัญหา:** `frontend/app/api/upload/avatar/route.ts` ใช้ `fs.writeFile` เขียนลง `public/uploads/avatars/` — **Vercel filesystem เป็น read-only** โค้ดนี้จะพังทันทีบน production

**แก้:** เปลี่ยนไปใช้ Supabase Storage
```ts
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, serviceRoleKey);
await supabase.storage.from("avatars").upload(filename, buffer, {
  contentType: file.type, upsert: true,
});
const { data } = supabase.storage.from("avatars").getPublicUrl(filename);
```
- สร้าง bucket `avatars` เป็น **public**
- เก็บ `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` เป็น env
- อัปเดต schema `User.avatarUrl` ให้เก็บ full URL (ปัจจุบันเก็บ `/uploads/avatars/xxx.png`)
- เขียน migration script ย้ายไฟล์เก่าใน `public/uploads/avatars/` ขึ้น Supabase แล้ว update path ใน DB

### 2.2 Prisma + Postgres Connection Pooling

**ปัญหา:** Vercel serverless เปิด connection ใหม่ทุก invocation — Postgres จะหมด connection

**แก้:**
- ใช้ **Supabase pooler URL** สำหรับ runtime (port 6543, pgbouncer mode) ใน `DATABASE_URL`
- ใช้ **direct URL** (port 5432) สำหรับ migrations ใน `DIRECT_URL`
- แก้ `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
- โปรเจกต์ใช้ `@prisma/adapter-pg` อยู่แล้ว — เข้ากันได้ดีกับ serverless

### 2.3 `next.config.ts` — ลบ `output: "standalone"`

Vercel ไม่ต้องการ standalone (มีไว้สำหรับ Docker) — ลบออก:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  experimental: { turbopack: false },
};
```

### 2.4 `@resvg/resvg-js` Native Binary

Package นี้เป็น native binary — **ต้องทดสอบว่า Vercel Node runtime รันได้** (โดยทั่วไปได้ แต่อาจต้อง set function ที่ใช้ไปเป็น Node runtime ไม่ใช่ Edge) เพิ่ม `export const runtime = "nodejs"` ใน route ที่เรียก resvg

### 2.5 `docxtemplater` + `html-to-image`

- `docxtemplater` — Node-only, ต้องบังคับ `runtime = "nodejs"`
- `html-to-image` — ทำงานฝั่ง client อยู่แล้ว ไม่กระทบ

### 2.6 NextAuth env

เปลี่ยนจาก `AUTH_URL=http://localhost:3003` เป็น production URL ของ Vercel และตั้ง `AUTH_TRUST_HOST=true`

---

## 3. Environment Variables ที่ต้องตั้งบน Vercel

```
# Database (Supabase)
DATABASE_URL=postgresql://postgres.xxx:PWD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.xxx:PWD@aws-0-region.pooler.supabase.com:5432/postgres

# NextAuth
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://<your-app>.vercel.app
AUTH_TRUST_HOST=true

# Supabase Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  # ถ้า client ต้อง read

# Email
RESEND_API_KEY=<resend-key>
```

---

## 4. ขั้นตอนการย้ายทีละสเต็ป

### Phase 1: เตรียมความพร้อม (ทำใน branch แยก)
1. สร้าง Supabase project (เลือก region ใกล้ผู้ใช้ เช่น `ap-southeast-1` Singapore)
2. สร้าง Storage bucket `avatars` (public)
3. เพิ่ม dependency: `npm i @supabase/supabase-js`
4. แก้ `avatar/route.ts` → Supabase Storage (2.1)
5. แก้ `next.config.ts` (2.3)
6. แก้ `schema.prisma` เพิ่ม `directUrl` (2.2)
7. เพิ่ม `export const runtime = "nodejs"` ใน route ที่ใช้ resvg / docxtemplater
8. ทดสอบ local โดยชี้ `DATABASE_URL` ไปที่ Supabase (pooler) ให้แน่ใจว่า Prisma ทำงาน

### Phase 2: ย้ายข้อมูล
9. Dump ข้อมูลจาก Postgres เดิม:
   ```bash
   pg_dump -h localhost -p 5434 -U petraband -d petraband \
     --no-owner --no-privileges -Fc -f petraband_prod.dump
   ```
10. Restore ขึ้น Supabase ผ่าน `pg_restore` โดยใช้ **direct URL** (port 5432):
    ```bash
    pg_restore -d "postgresql://postgres.xxx:PWD@...:5432/postgres" \
      --no-owner --no-privileges petraband_prod.dump
    ```
11. รัน `prisma migrate deploy` เพื่อ sync migration history
12. อัปโหลดไฟล์ avatar เดิมจาก `public/uploads/avatars/` ขึ้น Supabase Storage แล้ว update `User.avatarUrl` ใน DB (เขียน script one-off)

### Phase 3: Deploy ขึ้น Vercel
13. Connect GitHub repo กับ Vercel
14. ตั้ง **Root Directory** = `frontend` ใน Project Settings
15. Build Command: `prisma generate && next build` (หรือใส่ใน `postinstall` ใน package.json)
16. ตั้ง env vars ทั้งหมดตามหัวข้อ 3
17. Deploy preview → ทดสอบ:
    - Login / Password reset (email flow)
    - Upload avatar → เช็คว่าขึ้น Supabase Storage
    - Word export งานแสดง (docxtemplater + resvg)
    - Excel import / export
    - Stage layout save/restore
18. Deploy production เมื่อผ่านหมด

### Phase 4: หลังย้าย
19. ตั้ง custom domain (ถ้ามี) + ปรับ `AUTH_URL`
20. เปิด **Supabase Point-in-Time Recovery** (ต้อง Pro plan) หรือ scheduled `pg_dump` ไปเก็บนอก
21. Monitor Vercel Function logs + Supabase Database logs 1-2 สัปดาห์
22. ปิด Docker deployment เก่า, เก็บ `petraband_backup.sql` ไว้เป็น safety net อย่างน้อย 30 วัน

---

## 5. ค่าใช้จ่ายโดยประมาณ (USD/เดือน)

| Tier | Vercel | Supabase | รวม |
|---|---|---|---|
| Hobby / Free | $0 | $0 (500MB DB, 1GB Storage) | **$0** |
| Pro | $20 | $25 (8GB DB, 100GB Storage, backups) | **~$45** |

**แนะนำ:** เริ่มด้วย Free tier ทั้งคู่ อัปเกรดเป็น Pro เมื่อ:
- DB > 500MB
- ต้องการ daily backup (Supabase Free ไม่มี)
- Bandwidth Vercel Hobby ไม่พอ (100GB/เดือน)

---

## 6. ความเสี่ยง & Rollback Plan

| ความเสี่ยง | แผนรับมือ |
|---|---|
| `@resvg/resvg-js` รันไม่ได้บน Vercel | เปลี่ยนไปใช้ `sharp` หรือ render ผังเวทีเป็น PNG ฝั่ง client (html-to-image → base64) ส่งกลับมา embed ใน docx |
| Connection pool หมด | ตั้ง `connection_limit=1` ใน `DATABASE_URL` (สำคัญมากสำหรับ serverless) |
| Cold start ช้าบน Vercel Free | อัปเกรด Pro (เร็วขึ้น) หรือใช้ Vercel Cron ping warm-up |
| Data loss ตอนย้าย | ทำ dry-run บน Supabase project แยกก่อน, ห้ามลบ Docker DB จนกว่าจะยืนยัน production ทำงานครบ 2 สัปดาห์ |
| ผู้ใช้ upload ตอนช่วง cutover | ประกาศ downtime สั้นๆ (15-30 นาที) ตอน pg_dump/restore |

---

## 7. Checklist ก่อน Cutover

- [ ] Supabase project สร้างแล้ว + bucket `avatars` public
- [ ] โค้ด avatar upload เขียนใหม่ + ทดสอบ local
- [ ] `next.config.ts` ลบ standalone
- [ ] `schema.prisma` เพิ่ม `directUrl`
- [ ] Runtime = "nodejs" ใน route ที่ใช้ native module
- [ ] Env vars ครบทั้ง 8 ตัวบน Vercel
- [ ] `pg_dump` + `pg_restore` ทดสอบสำเร็จบน Supabase
- [ ] Avatar files ย้ายขึ้น Storage + DB path อัปเดต
- [ ] Preview deploy ทดสอบครบทุก flow
- [ ] Custom domain / DNS พร้อม (ถ้ามี)
- [ ] Backup DB เดิมเก็บออก 1 ชุด
