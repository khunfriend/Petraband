# WORKLOG

> ไฟล์สถานะงานสด — session ใหม่อ่านไฟล์นี้ก่อนเสมอ (ดู [CLAUDE.md](CLAUDE.md))
> อัปเดตทุกครั้งที่จบก้อนงาน ไม่ใช่ตอนจบ session อย่างเดียว

**อัปเดตล่าสุด:** 16 ก.ย. 2569 · commit ล่าสุด `b1f1021`

---

## 🔴 กำลังทำอยู่

ว่าง — หยิบข้อถัดไปได้เลย

## ⏭️ ถัดไปคือ (เรียงตามลำดับที่ควรทำ)

### 1. [ต้อง migrate DB] Border / จัดบน-กลาง-ล่าง / Wrap Text

`CellStyle` ทั้งใน `frontend/components/sheets/types.ts` และ `schema.prisma` **ไม่มีฟิลด์** `border*`, `verticalAlign`, `wrapText` → ทำ UI อย่างเดียวไม่พอ ต้อง migration ก่อน
(`whiteSpace: "nowrap"` hardcode อยู่ที่ `SheetGrid.tsx:1060`)

### 2. ยังไม่มี: move row/col, drag-drop ข้อมูล, fill handle, ลบ format, ปุ่ม A+/A−

`shiftCells`/`shiftSizes`/`shiftMerges` ใน `SheetGrid.tsx` กับ endpoint `structure` ใช้ต่อกับ move row/col ได้เลย (ย้าย = ลบแล้วแทรก)

---

## ✅ เสร็จแล้ว

- **16 ก.ย. 2569** — ลบ/แทรกแถว-คอลัมน์ให้เลื่อนข้อมูลถูกต้อง (FR-8.10)
  เดิมลบแถวกลางแล้วข้อมูลข้างล่างไม่ขยับ กลายเป็นแถวสุดท้ายหายแทน · ตอนนี้ขยับครบทั้ง cells, merges, `ColumnWidth`, `RowHeight` และ `rowCount`/`columnCount`
  ฝั่ง DB: `POST /api/sheets/[id]/structure` ({axis, op, at}) ทำใน transaction เดียว ขยับ `Cell` เองเพื่อให้ `CellStyle` ที่ผูก `cellId` ตามไปด้วย · ต้องพักค่า index ไว้ที่ +1,000,000 ก่อนแล้วดึงกลับ เพราะ `Cell`/`RowHeight`/`ColumnWidth` มี unique/PK บนพิกัด จะชนกันกลางคำสั่ง
  ฝั่ง client มี `shiftCells`/`shiftSizes`/`shiftMerges` สะท้อน logic เดียวกันเพื่อไม่ต้อง refetch — **ถ้าแก้ฝั่งใดต้องแก้อีกฝั่งด้วย**
  undo บันทึก `op` ไว้ใน snapshot แล้วสั่งคำสั่งตรงข้ามกับ server แทนการ diff พิกัดที่ขยับไปแล้ว
  **บั๊กที่เจอระหว่างทดสอบ 2 ตัว:** (1) merge ที่จบพอดีที่แถว/คอลัมน์ที่ถูกลบไม่หด — เงื่อนไขต้องเป็น `end >= at` ไม่ใช่ `end > at` (2) undo ไม่คืนขอบเขต merge ที่หดไป เพราะการแทรกกลับไม่ขยาย merge ให้ — แก้โดยให้ endpoint คืน merges ปัจจุบันกลับมา แล้ว diff กับ snapshot
  ยืนยันใน DB จริง: ลบแถวกลาง (ข้อมูล+merge+ความสูงเลื่อนครบ) · ลบคอลัมน์ (merge หดจาก endCol 1→0) · undo ทั้งสองแบบคืนค่าครบรวม merge

- **16 ก.ย. 2569** — ขยาย Undo / Redo ให้ครอบทุกอย่าง (FR-8.15) + ปุ่ม ↶ ↷ บน toolbar
  snapshot เปลี่ยนจากเก็บเฉพาะ `cells` เป็นเก็บทั้งชุด (`cells` + `merges` + `colWidths` + `rowHeights` + `rowCount`/`colCount`) · `pushHistory({...})` รับเฉพาะส่วนที่เปลี่ยน ที่เหลืออ่านจาก state ปัจจุบัน
  การย้อนบันทึกลง DB ครบทุกชนิด: เพิ่ม `saveStyleDiff` (ของเดิม `saveCellDiff` ไม่ครอบ style) · `saveSizeDiff` · `saveMergeDiff` ที่จับคู่ merge **ด้วยพิกัด ไม่ใช่ id** เพราะ merge ที่สร้างใหม่จะได้ id ใหม่
  ปรับขนาด = 1 ครั้งต่อการลาก (push ตอน mouseup) ไม่ใช่ทุก mousemove
  ยืนยันบนสมุดทดสอบที่สร้าง-แล้ว-ลบทิ้ง: merge→undo (DELETE 200) →redo (POST 201) · bold→undo (700→400) · เพิ่มแถว→undo (11→10) · ลากขยายคอลัมน์→undo (192px→100px) · DB ตรงทุกค่า
- **16 ก.ย. 2569** — Copy / Cut (FR-8.14) + ซ่อมประวัติ undo ที่ถูกบันทึกซ้ำ
  ใช้รูปแบบ TSV เดียวกับ paste เดิม จึงคัดลอกไป-กลับกับ Excel ได้สองทาง · ปุ่ม Delete ใช้ helper `clearSelectedCells` ตัวเดียวกับ cut
  **เจอระหว่างทดสอบ:** `pushHistory` ถูกเรียก**ข้างใน** `setCells` updater ซึ่ง React StrictMode เรียกซ้ำสองรอบใน dev → ประวัติถูกบันทึกซ้ำ ต้องกด undo สองครั้งต่อการกระทำเดียว แก้โดยย้าย `pushHistory`/`queueCellSave` ออกมานอก updater ทั้ง 3 จุด (commitEdit, clearSelectedCells, handlePaste) — updater ต้องเป็นฟังก์ชันบริสุทธิ์
  ยืนยันบนสมุดทดสอบที่สร้าง-แล้ว-ลบทิ้ง: copy ได้ TSV ถูกต้อง · copy→paste ได้ข้อมูลตรง · cut ได้ TSV + ล้างเซลล์ · undo หลัง cut กดครั้งเดียวย้อนได้ · DB ตรงกับที่เห็นบนจอ
  ✅ เจ้าของยืนยันด้วยมือจริงแล้วว่า Ctrl+C / Ctrl+V และ Cmd+Z ใช้ได้ปกติ (อาการที่เจอตอนทดสอบเป็นข้อจำกัดของ automation ไม่ใช่บั๊ก)
- **16 ก.ย. 2569** — แก้ปัญหาลบสมาชิกไม่ได้ (migration `20260916000000_decouple_user_refs` **apply ลง production แล้ว**)
  8 relation ที่ชี้ User แบบไม่ได้ตั้ง `onDelete` → ประวัติ + ผู้สร้างของส่วนกลาง (`SongVersion`, `StageLayoutVersion`, `AuditLog`, `PracticeSchedule`, `AvailabilityPoll`) เป็น `SetNull` + เก็บชื่อ snapshot; ข้อมูลรายคน (`Rsvp`, `SongAssignment`, `RehearsalAttendance`) เป็น `Cascade`
  ยืนยันบน production แล้ว: `user.delete()` สำเร็จ (เดิม throw FK error) · `SongVersion` อยู่ต่อโดย `createdById=null` แต่ชื่อยังอยู่ · `Rsvp`/`SongAssignment` หายตาม · backfill เติมชื่อแถวเดิมครบ · ข้อมูลทดสอบลบทิ้งหมดแล้ว
  backup ก่อนรัน: `/Users/friend/Petraband-backups/petraband-2026-09-16T07-30-47-146Z.json`
- **16 ก.ย. 2569** — 🐛 [P0] ซ่อม undo ล้างข้อมูลทั้งชีต: `SheetGrid.tsx:157` เคย seed history ด้วย `[new Map()]` ทำให้ Ctrl+Z ครั้งแรกล้างเซลล์ทั้งหมดและเขียน `null` ลง DB → เปลี่ยนเป็น `[cells]` (ปลอดภัยเพราะ snapshot ไม่เคยถูก mutate in-place และ component มี `key={sheet.id}` อยู่แล้ว)
  verify ในเบราว์เซอร์ 2 รอบบนสมุดโน้ตทดสอบที่สร้าง-แล้ว-ลบทิ้ง: undo ย้อนเฉพาะช่องล่าสุด เซลล์เดิมอยู่ครบทั้งบนจอและใน DB · `tsc` / `eslint` / `npm test` (28) ผ่าน
- **16 ก.ย. 2569** — PRD v4.0 (`8a95836`): เปลี่ยน auth เป็น Google sign-in, คง Credentials เฉพาะบัญชีชั่วคราว, ตัด FR-1.4 / แคบ FR-5.4, บันทึกงานค้าง auth ในหัวข้อ 5
- **16 ก.ย. 2569** — ตรวจ sheet editor ครบ 5 หมวดตาม checklist (ผลอยู่ในหัวข้อ "ถัดไปคือ" ด้านบน)

---

## 📌 การตัดสินใจที่ค้างอยู่ (อย่าเดาเอง — ถามเจ้าของก่อน)

- **repo นอกที่ `/Users/friend`** — ค้าง 275 ไฟล์, ahead 37 / behind 73, มี `secrets.txt`, `.Trash` และมี commit `329653e69` ที่ลงผิดที่ ยังไม่ได้ตัดสินใจว่าจะลบ / ปล่อยไว้ / ย้ายของออก **ห้ามแตะจนกว่าจะได้คำสั่ง**
- **auth migration (PRD หัวข้อ 5)** — ต้องเช็คก่อนว่าสมาชิกทุกคนมีอีเมลผูก Google ได้จริง ก่อนตัด password login
- **โค้ด Supabase ที่ค้างอยู่** — `app/auth/callback/route.ts`, model `PendingRegistration`, field `supabaseUserId` ไม่ถูกเรียกใช้แล้วตั้งแต่ `a67337a` รอลบตอนย้ายไป Google

## 🪤 กับดักที่เจอมาแล้ว

- **repo ซ้อน 2 ตัว** — อ่าน CLAUDE.md ก่อนใช้ git ทุกครั้ง
- ไฟล์ PRD ใน repo นอกเป็นคนละเวอร์ชันกับ repo ใน อย่าเอามาเทียบกัน
- **🚨 `frontend/.env` ชี้ `DATABASE_URL` ไปที่ Supabase production โดยตรง** (`aws-0-ap-southeast-1.pooler.supabase.com`) — ไม่มี DB local, ไม่มี `.env.local`
  → **`npm run dev` ในเครื่อง = อ่าน/เขียนฐานข้อมูลจริงของวงทันที** ไม่มีตัวกั้นใด ๆ ตรวจ `DATABASE_URL` ก่อนรันอะไรที่เขียน DB เสมอ
  → ปัจจุบันมีโน้ตจริง 3,841 เซลล์ใน 12 สมุด — ห้ามทดสอบฟีเจอร์ที่ลบ/ล้างข้อมูล (undo, delete row/col, paste ทับ) บนโน้ตจริง ให้สร้างสมุดทดสอบเองแล้วลบทิ้ง
  → ห้ามรัน `npm run db:seed` ส่ง ๆ เพราะ upsert ทับข้อมูลจริงได้
  → **ควรพิจารณาทำ DB สำหรับ dev แยกต่างหาก** เรื่องนี้ยังไม่ได้ตัดสินใจ
- **`DELETE /api/users/[id]` (`route.ts:80`) ยังไม่มี try/catch** — error จาก DB จะโยนเป็น 500 ดิบ ๆ ให้หน้า admin โดยไม่บอกสาเหตุ ตอนนี้เคส FK แก้ที่ต้นเหตุไปแล้ว แต่ error handling ยังไม่มี **ยังไม่ได้แก้**
- **บัญชี seed `admin@petraband.club` มีอยู่จริงแต่รหัสไม่ใช่ `admin1234` แล้ว** — ต้องให้เจ้าของ login ให้เองตอนต้องทดสอบผ่าน UI อย่าเดารหัส
- Prisma 7 ที่นี่ใช้ driver adapter — สร้าง `PrismaClient` ต้องส่ง `new PrismaPg({connectionString})` เสมอ (ดู `frontend/lib/prisma.ts`) เขียนสคริปต์ probe แบบ `new PrismaClient()` เปล่า ๆ จะพังทันที และสคริปต์ต้องวางใน `frontend/` ถึงจะ resolve โมดูลเจอ
