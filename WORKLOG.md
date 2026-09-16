# WORKLOG

> ไฟล์สถานะงานสด — session ใหม่อ่านไฟล์นี้ก่อนเสมอ (ดู [CLAUDE.md](CLAUDE.md))
> อัปเดตทุกครั้งที่จบก้อนงาน ไม่ใช่ตอนจบ session อย่างเดียว

**อัปเดตล่าสุด:** 16 ก.ย. 2569 · commit ล่าสุด `bfc9926`

---

## 🔴 กำลังทำอยู่

ว่าง — หยิบข้อถัดไปได้เลย

## ⏭️ ถัดไปคือ (เรียงตามลำดับที่ควรทำ)

### 0. ❓ Cmd+Z ไม่ทำงาน มีแต่ Ctrl+Z (ยังไม่ยืนยัน)

ระหว่าง verify บั๊ก undo พบว่ากด **Ctrl+Z ทำงาน แต่ Cmd+Z ไม่ทำงาน** ทดสอบซ้ำได้ทั้งสองรอบ ทั้งที่ `handleKeyDown` (`SheetGrid.tsx:618`) เช็ค `(e.ctrlKey || e.metaKey)` และ probe ยืนยันว่า event เข้าถึง container จริงพร้อม `metaKey:true`, `defaultPrevented:false`

ผู้ใช้ส่วนใหญ่อยู่บน Mac และจะกด Cmd+Z เป็นธรรมชาติ → **ต้องลองด้วยมือบน Mac จริงก่อน** ว่าเป็นบั๊กจริงหรือเป็นข้อจำกัดของ automation harness ที่ใช้ทดสอบ ถ้าเป็นบั๊กจริงถือว่าสำคัญ เพราะแปลว่า undo ใช้ไม่ได้สำหรับคนส่วนใหญ่

### 2. Delete Row / Column ไม่เลื่อนข้อมูล

`deleteRow` (`:878`) / `deleteCol` (`:919`) แค่ล้างค่าในแถวเป้าหมายแล้วลด count → ข้อมูลข้างล่างไม่เลื่อนขึ้น ผลคือแถวสุดท้ายหายแทนแถวที่เลือก
ประเด็นเดียวกัน: `addRow`/`addCol` ต่อท้ายอย่างเดียว แทรกกลางไม่ได้

### 3. ขยาย Undo ให้ครอบ style / merge / resize

ตอนนี้ `pushHistory` ถูกเรียกเฉพาะตอนแก้ค่าเซลล์ (`commitEdit`, `handlePaste`, ปุ่ม Delete) ไม่ครอบ `applyStyle`, `mergeCells`, resize, เพิ่ม/ลบแถว และไม่มีปุ่ม undo/redo บน toolbar

### 5. [ต้อง migrate DB] Border / จัดบน-กลาง-ล่าง / Wrap Text

`CellStyle` ทั้งใน `frontend/components/sheets/types.ts` และ `schema.prisma` **ไม่มีฟิลด์** `border*`, `verticalAlign`, `wrapText` → ทำ UI อย่างเดียวไม่พอ ต้อง migration ก่อน
(`whiteSpace: "nowrap"` hardcode อยู่ที่ `SheetGrid.tsx:1060`)

### 6. ยังไม่มี: move row/col, drag-drop ข้อมูล, fill handle, ลบ format, ปุ่ม A+/A-

---

## ✅ เสร็จแล้ว

- **16 ก.ย. 2569** — Copy / Cut (FR-8.14) + ซ่อมประวัติ undo ที่ถูกบันทึกซ้ำ
  ใช้รูปแบบ TSV เดียวกับ paste เดิม จึงคัดลอกไป-กลับกับ Excel ได้สองทาง · ปุ่ม Delete ใช้ helper `clearSelectedCells` ตัวเดียวกับ cut
  **เจอระหว่างทดสอบ:** `pushHistory` ถูกเรียก**ข้างใน** `setCells` updater ซึ่ง React StrictMode เรียกซ้ำสองรอบใน dev → ประวัติถูกบันทึกซ้ำ ต้องกด undo สองครั้งต่อการกระทำเดียว แก้โดยย้าย `pushHistory`/`queueCellSave` ออกมานอก updater ทั้ง 3 จุด (commitEdit, clearSelectedCells, handlePaste) — updater ต้องเป็นฟังก์ชันบริสุทธิ์
  ยืนยันบนสมุดทดสอบที่สร้าง-แล้ว-ลบทิ้ง: copy ได้ TSV ถูกต้อง · copy→paste ได้ข้อมูลตรง · cut ได้ TSV + ล้างเซลล์ · undo หลัง cut กดครั้งเดียวย้อนได้ · DB ตรงกับที่เห็นบนจอ
  ⚠️ หมายเหตุ: คลิปบอร์ดจริงของ OS ไม่เชื่อมกับ automation จึงทดสอบด้วยการยิง ClipboardEvent ตรง ๆ — **ควรลองกด Ctrl+C / Ctrl+V ด้วยมือจริงอีกครั้ง**
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
