# PETRAband — คู่มือสำหรับ session ใหม่

## ⚠️ อ่านก่อนทำอะไรทั้งสิ้น: repo ซ้อนกัน 2 ตัว

เครื่องนี้มี git repo สองตัวที่ **ชี้ origin เดียวกัน** (`github.com/khunfriend/Petraband.git`)

| path | สถานะ | ใช้ไหม |
|---|---|---|
| `/Users/friend/Petraband/` | repo จริงของโปรเจกต์ | ✅ **ทำงานที่นี่เท่านั้น** |
| `/Users/friend/` (home dir) | repo ขยะ ค้าง ~275 ไฟล์, diverged, มี `secrets.txt` | ❌ **ห้าม commit / push เด็ดขาด** |

**ก่อน `git` ทุกครั้ง** ให้ยืนยันว่าอยู่ repo ถูกตัว:

```bash
git rev-parse --show-toplevel
```

ต้องได้ `/Users/friend/Petraband` เท่านั้น ถ้าได้ `/Users/friend` แปลว่าอยู่ผิดที่ — `cd` เข้ามาก่อน

> เคยพลาดมาแล้ว: commit `329653e69` ลงใน repo นอกโดยไม่รู้ตัว เพราะ `cd` อยู่ที่ home dir แล้ว `git status` ก็ขึ้นไฟล์ `Petraband/...` เหมือนถูกต้องทุกอย่าง

## เริ่ม session ใหม่ยังไง

1. อ่าน [`WORKLOG.md`](WORKLOG.md) — สถานะงานปัจจุบัน, สิ่งที่ตัดสินใจไปแล้ว, กับดักที่เจอ
2. `git log --oneline -10` — ดูว่า commit ล่าสุดไปถึงไหน
3. `git status` — ถ้ามีไฟล์ค้าง ให้เช็ค WORKLOG ว่าค้างเพราะอะไร ก่อนจะแก้หรือทิ้ง
4. ทำงานต่อจากหัวข้อ "กำลังทำอยู่" ใน WORKLOG

## จบ session / ก่อนหยุดพัก

1. commit งานที่เสร็จเป็นก้อนเล็ก ๆ (อย่าปล่อยค้าง — working tree ที่ค้างคือสิ่งที่ session ใหม่อ่านไม่ออก)
2. อัปเดต `WORKLOG.md`: ย้ายที่เสร็จไป "เสร็จแล้ว", เขียน "ถัดไปคือ" ให้ชัดว่าจะหยิบอะไรต่อ
3. ถ้ามีงานค้างกลางคัน commit เป็น `wip:` ได้ แต่ต้องเขียนใน WORKLOG ว่าค้างตรงไหน เหลืออะไร

## โครงสร้าง

- โค้ดทั้งหมดอยู่ใน `frontend/` (Next.js 16 App Router + React 19 + TS)
- `frontend/prisma/schema.prisma` — DB schema (PostgreSQL)
- `PRD_ระบบจัดการวงดนตรีไทย.md` — spec หลัก หัวข้อ 5 คือรายการงานค้างระดับโปรดักต์

## ฐานข้อมูล: dev ในเครื่อง vs production

`frontend/.env` ชี้ไป **Supabase production** ส่วน `frontend/.env.local` (ไม่ขึ้น git) ชี้ไป **dev ในเครื่อง** และถูกอ่านก่อนเสมอ ทั้งใน Next.js, `prisma.config.ts` และ `prisma/seed.ts` — ตราบใดที่ `.env.local` อยู่ ทุกอย่างในเครื่องจะวิ่งเข้า dev

```bash
docker start petraband-dev     # เปิด dev DB (postgres:17 พอร์ต 5435)
docker stop petraband-dev      # ปิด
```

บัญชีสำหรับ dev: `admin@petraband.club` / `admin1234` (จาก `npm run db:seed`)

**ยืนยันว่าต่อถูกที่ก่อนทำงานเสมอ:**

```bash
cd frontend && npx prisma migrate status | grep Datasource
```

ต้องขึ้น `localhost:5435` ถ้าขึ้น `pooler.supabase.com` แปลว่ากำลังจะแก้ข้อมูลจริงของวง

**⚠️ เปลี่ยน `.env.local` แล้วต้องรีสตาร์ท dev server** — Next.js โหลด env ใหม่เองก็จริง แต่ `lib/prisma.ts` แคช client ไว้ใน `globalForPrisma` เพื่อให้รอด hot-reload ตัวที่แคชไว้ยังถือ connection string เดิม

ถ้าจะกลับไปใช้ production ชั่วคราว ให้เปลี่ยนชื่อ `.env.local` เป็น `.env.local.off` แล้วรีสตาร์ท

## คำสั่ง (รันใน `frontend/`)

```bash
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run lint         # eslint
npm test             # vitest run
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
```

## ข้อควรระวัง

- **อย่า push** จนกว่าเจ้าของจะสั่ง — repo จริง ahead อยู่ และ repo นอก diverged หนัก
- แก้ schema ต้องมาพร้อม migration เสมอ (`npm run db:migrate`) อย่าแก้ `schema.prisma` เฉย ๆ
- UI ทั้งหมดเป็นภาษาไทย ใช้ปฏิทิน พ.ศ.
