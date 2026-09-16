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
