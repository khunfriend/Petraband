# WORKLOG

> ไฟล์สถานะงานสด — session ใหม่อ่านไฟล์นี้ก่อนเสมอ (ดู [CLAUDE.md](CLAUDE.md))
> อัปเดตทุกครั้งที่จบก้อนงาน ไม่ใช่ตอนจบ session อย่างเดียว

**อัปเดตล่าสุด:** 24 ก.ย. 2569 · commit ล่าสุด `a34dc1d`

---

## 🔴 กำลังทำอยู่

### ⏸️ Google Sign-in — โค้ดเสร็จ ทดสอบบน dev ได้บางส่วน **ยังห้าม deploy**

🚨 **ห้าม deploy ขึ้น production จนกว่าจะยืนยันว่า Google login ใช้ได้จริง** — การ์ดใหม่ใน Credentials ปฏิเสธทุกบัญชีที่ `isTemporary !== true` ถ้าขึ้น production ก่อนที่ Google จะทำงาน **ทั้งวงจะเข้าระบบไม่ได้ทันที** และไม่มีใครเข้าไปแก้ได้ด้วย

**ทำไปแล้ว:** Google provider ใน `auth.ts` · `signIn` callback สร้าง user สถานะ `PENDING_APPROVAL` เมื่อ login ครั้งแรกแล้วเด้งกลับ `/login?pending=1` (deny-by-default) · link บัญชีเดิมด้วย email + ล้าง `passwordHash` ของสมาชิกปกติ · การ์ด `isTemporary` ใน Credentials · `jwt` callback ดึง row จริงจาก DB เพราะ Google คืนมาแต่ profile ของตัวเอง · ปุ่ม + ข้อความแจ้งสถานะบนหน้า login
**ผูกบัญชีด้วย email ไม่ใช่ `googleId`** — Google ยืนยันอีเมลให้อยู่แล้ว และเลี่ยง migration เพิ่ม (ถ้าอยากเก็บ `sub` ค่อยเพิ่มทีหลัง)

**ทดสอบแล้ว:** การ์ดบล็อก `admin@petraband.club` จริง (log: `not a temporary account, use Google`) · ปุ่ม Google redirect ไป accounts.google.com ได้ client ID ตรง ไม่มี `redirect_uri_mismatch`
**ยังทดสอบไม่ได้ (ต้องใช้บัญชี Google ของเจ้าของ):** login จนจบ → สร้าง PENDING_APPROVAL → อนุมัติ → เข้าได้จริง

**24 ก.ย.:** หน้า `/login` เหลือแค่ปุ่ม Google · ฟอร์มอีเมล/รหัสผ่านย้ายไป `/login/guest` (เฉพาะบัญชีชั่วคราว) · `/register` เหลือปุ่ม "สมัครด้วย Google" (Google login ครั้งแรก = สมัคร) · `POST /api/auth/register` ตอบ 410 แล้ว (บัญชีรหัสผ่านที่สร้างจากตรงนั้นเข้าระบบไม่ได้อยู่ดี) · ยังค้าง: ลบ `/forgot-password`, `/reset-password`, `/verify-pending`, `/auth/callback` (ตัวหลังยัง redirect ไป `?pending_approval=1`)
**24 ก.ย. (2):** `/register` ให้กรอกชื่อเล่น (ไทยล้วน) + รุ่น (ตัวเลข → เก็บเป็น `#20`) ก่อนไป Google · ส่งผ่าน cookie `pb_signup` (httpOnly, 10 นาที) ให้ `signIn` callback · ไม่ใช้ชื่อจาก Google แล้ว · Google account ใหม่ที่ไม่มี cookie (กด login โดยไม่เคยสมัคร) จะไม่ถูกสร้างบัญชี เด้งไป `/register?error=need_profile` · validation อยู่ที่ `lib/signup.ts`
**24 ก.ย. (3):** แอดมินสร้างได้แค่บัญชีชั่วคราว (หน้าสมาชิกไม่มีสวิตช์ทั่วไป/ชั่วคราว ไม่มีช่องอีเมล · `POST /api/users` บังคับ `isTemporary` + ต้องมีงานแสดง) · บัญชีชั่วคราว login ด้วย **ชื่อเล่น + รหัสผ่านที่แอดมินตั้ง** ที่ `/login/guest` · อีเมลเป็น placeholder `<uuid>@guest.petraband.invalid` (ไม่ต้อง migration, ส่งเมลไม่ถึงแน่นอน) · ชื่อเล่นห้ามซ้ำในบัญชีชั่วคราว (ไม่สนตัวพิมพ์) ทั้งตอนสร้างและตอนแก้ · บัญชีชั่วคราวเก่าที่ชื่อซ้ำกัน `authorize` ใช้รหัสผ่านแยกให้
**ขั้นต่อไป:** เจ้าของกดปุ่ม "เข้าสู่ระบบด้วย Google" บน localhost:3000 แล้วบอกผลมา จากนั้นผมจะ set บัญชีนั้นเป็น ACTIVE+ADMIN ใน dev DB เพื่อทดสอบรอบสอง

### ⏸️ คลังผังเวที — โค้ดเสร็จ ทดสอบบน dev ผ่าน · commit `36a2df0` · **migration ยังไม่ลง production**

หน้า อุปกรณ์ → แท็บ "ตั้งค่าสำหรับผังเวที" (`app/equipment/StageLibraryTab.tsx`): แก้ชื่อ / ไอคอน (เลือกจาก 9 แบบใน `components/stage/InstrumentIcon.tsx`) / กว้าง×ลึก (0.1–10 ม.) / ประเภท · เพิ่มชิ้นใหม่ · ลบได้เฉพาะชิ้นที่ไม่มีผังเวที เพลง หรือสมาชิกอ้างถึง (409)
Migration `20260924120000_instrument_is_playable`: `Instrument.isPlayable` (default true) — `false` = อุปกรณ์บนเวที ขึ้นใน palette หมวด "อุปกรณ์" ของผังเวที แต่ไม่ขึ้นในช่องเลือกเครื่องดนตรีของโปรไฟล์/สมาชิก
API `/api/instruments` POST + `[id]` PATCH (มี zod แล้ว เดิมไม่ validate) + DELETE · schema ที่ `lib/instrumentSchema.ts`
⚠️ ต้องรีสตาร์ท dev server หลัง migrate (Prisma client ค้างใน `globalForPrisma` → `PrismaClientValidationError: isPlayable`)

### ⏸️ อุปกรณ์เสริมตั้งค่าได้ — ทดสอบบน dev ผ่าน · **migration ยังไม่ลง production**

แท็บ "ตั้งค่าอุปกรณ์ในการแสดง" (`app/equipment/InstrumentEquipmentTab.tsx`): เพิ่ม/ลบ/เปลี่ยนชื่ออุปกรณ์เสริมได้ + "ใช้ต่อคน" + ตารางจำนวนต่อเครื่องดนตรี (เลือกจาก `lib/positions.ts` ซึ่งย้ายมาจาก PerformanceClient) · หน้างานแสดงคำนวณด้วย `lib/accessories.ts` (มีเทสต์)
Migration `20260924140000_accessory_types`: ตาราง `AccessoryType` (seed สแตนโน้ต/ขาไมค์ perPlayer 1, เก้าอี้/โต๊ะ 0 — ผลลัพธ์เท่าของเดิมที่ hard-code) · `InstrumentEquipment.accessories` JSON `{accessoryId: n}` แทน `chairs`/`tables` (ย้ายค่าเดิมให้แล้วค่อย drop — production ณ 16 ก.ย. ตารางนี้ว่าง)
หมายเหตุต่องาน (`Performance.equipmentNotes`) ยังผูกกับ**ชื่อ**อุปกรณ์ — เปลี่ยนชื่อแล้วหมายเหตุเดิมของชื่อเก่าจะไม่แสดง

### ⏸️ ปรับขนาดเฉพาะข้อความที่คลุมในเซลล์ — แก้แล้ว ทดสอบบน dev ผ่าน · ยังไม่ commit

บั๊ก: คลุมข้อความบางส่วน → กด ▲ ที่ช่องขนาดได้แค่ครั้งแรก (+1) แล้ว focus เด้งกลับเข้าเซลล์ · สาเหตุ: `restoreEditorSelection` ใส่ selection กลับใน contentEditable → **Chrome ย้าย focus ตาม** → เช็ค "ยังอยู่ที่ toolbar" ไม่ผ่าน → `editor.focus()`
แก้: `applyStyleToRange` (richText.ts) ทำงานกับ Range ที่เก็บไว้ ไม่แตะ `window.getSelection()` · แก้ span เดิมแทนการซ้อน span ใหม่ทุกครั้ง · `commitSize` ตอน blur ไม่ apply ซ้ำ (เดิมดึง focus กลับเข้าเซลล์) · คลิกเซลล์อื่นระหว่างแก้ = บันทึกแล้วจบการแก้ (เดิม `if (editingCell) return` → ข้อความไม่ถูกบันทึกถ้า focus อยู่ที่ toolbar)

### ⏸️ วงกลมแดงนับคนรออนุมัติบนเมนู — ทดสอบบน dev ผ่าน · ยังไม่ commit

`GET /api/admin/users/pending-count` (ADMIN เท่านั้น, อื่น 403) · TopNav (`usePendingCount`) ดึงเฉพาะเมื่อ role = ADMIN — ตอนเปลี่ยนหน้า / กลับมาที่แท็บ / ทุก 60 วิ / ทันทีหลังอนุมัติ-ปฏิเสธ (event `PENDING_USERS_CHANGED` ใน `lib/pendingUsers.ts`) · 0 = ไม่แสดง · เกิน 99 = "99+"

## ⏭️ ถัดไปคือ (เรียงตามลำดับที่ควรทำ)

### 1. ยังไม่มี: move row/col, drag-drop ข้อมูล, fill handle, ลบ format, ปุ่ม A+/A−

`shiftCells`/`shiftSizes`/`shiftMerges` ใน `SheetGrid.tsx` กับ endpoint `structure` ใช้ต่อกับ move row/col ได้เลย (ย้าย = ลบแล้วแทรก)

---

## ✅ เสร็จแล้ว

- **16 ก.ย. 2569** — Border / จัดแนวตั้ง / Wrap Text (FR-8.18, 8.19, 8.22, 8.23) — migration **apply ลง production แล้ว**
  `CellStyle` เพิ่ม 6 คอลัมน์ · เส้นขอบเก็บเป็น CSS shorthand ด้านละคอลัมน์ (`"2px dashed #000000"`) จึงได้ทั้งความหนาและรูปแบบโดยไม่ต้องแยก 12 คอลัมน์ · ค่าว่าง = ไม่มีเส้น
  **บั๊กที่เจอระหว่างทดสอบ:** `saveStyleDiff` ส่งเฉพาะคีย์ที่มีใน snapshot ถ้า snapshot เก่าไม่มีคีย์นั้น Prisma ก็ไม่อัปเดต → **undo ย้อนบนจอแต่ DB ไม่เปลี่ยน** แก้โดยส่งทุก property พร้อมค่า default เสมอ (`DEFAULT_CELL_STYLE`) — บั๊กนี้กระทบการ undo ของ style **ทุกชนิด** ไม่ใช่แค่ของใหม่
  ยืนยันใน DB: ใส่เส้นขอบ 2px ประ รอบเซลล์ · ชิดบน · ตัดคำ (`pre-wrap` + ไม่ตัดท้ายด้วย `...`) · undo ทีละขั้นย้อนครบทั้งบนจอและใน DB จนกลับเป็น default ทุกค่า

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

- **Postgres ในเครื่อง (brew postgresql@16) ตั้ง require password ไว้** — ไม่ใช่ค่าเริ่มต้นของ Homebrew และไม่มีใครรู้รหัส จึงใช้ Docker แทน · มีคอนเทนเนอร์ของ **Petraband v1 เก่ารันค้างอยู่** (`petraband-db` 5433, `petraband-db-1` 5434, `petraband-api`, `petraband-frontend`) ยังไม่ได้ตัดสินใจว่าจะลบไหม **ห้ามแตะจนกว่าจะได้คำสั่ง**
- **repo นอกที่ `/Users/friend`** — ค้าง 275 ไฟล์, ahead 37 / behind 73, มี `secrets.txt`, `.Trash` และมี commit `329653e69` ที่ลงผิดที่ ยังไม่ได้ตัดสินใจว่าจะลบ / ปล่อยไว้ / ย้ายของออก **ห้ามแตะจนกว่าจะได้คำสั่ง**
- **auth migration (PRD หัวข้อ 5)** — ต้องเช็คก่อนว่าสมาชิกทุกคนมีอีเมลผูก Google ได้จริง ก่อนตัด password login
- **โค้ด Supabase ที่ค้างอยู่** — `app/auth/callback/route.ts`, model `PendingRegistration`, field `supabaseUserId` ไม่ถูกเรียกใช้แล้วตั้งแต่ `a67337a` รอลบตอนย้ายไป Google

## 🪤 กับดักที่เจอมาแล้ว

- **repo ซ้อน 2 ตัว** — อ่าน CLAUDE.md ก่อนใช้ git ทุกครั้ง
- ไฟล์ PRD ใน repo นอกเป็นคนละเวอร์ชันกับ repo ใน อย่าเอามาเทียบกัน
- **DB: มี dev แยกแล้ว (17 ก.ย. 2569)** — `frontend/.env.local` ชี้ Docker `petraband-dev` (postgres:17 พอร์ต 5435) และถูกอ่านก่อน `.env` เสมอ · `.env` ยังชี้ Supabase production ตามเดิม ไม่ถูกแตะ
  → **เปลี่ยน `.env.local` แล้วต้องรีสตาร์ท dev server** เพราะ `lib/prisma.ts` แคช client ไว้ใน `globalForPrisma` (Next.js reload env เองแต่ client ตัวเก่ายังถือ connection string เดิม)
  → เช็คก่อนทำงานทุกครั้ง: `npx prisma migrate status | grep Datasource` ต้องเป็น `localhost:5435`
  → production ปัจจุบัน: users 5, songs 12, cells 3,844 — ห้ามทดสอบฟีเจอร์ที่ลบ/ล้างข้อมูลกับมัน
- **`DELETE /api/users/[id]` (`route.ts:80`) ยังไม่มี try/catch** — error จาก DB จะโยนเป็น 500 ดิบ ๆ ให้หน้า admin โดยไม่บอกสาเหตุ ตอนนี้เคส FK แก้ที่ต้นเหตุไปแล้ว แต่ error handling ยังไม่มี **ยังไม่ได้แก้**
- **บัญชี seed `admin@petraband.club` มีอยู่จริงแต่รหัสไม่ใช่ `admin1234` แล้ว** — ต้องให้เจ้าของ login ให้เองตอนต้องทดสอบผ่าน UI อย่าเดารหัส
- Prisma 7 ที่นี่ใช้ driver adapter — สร้าง `PrismaClient` ต้องส่ง `new PrismaPg({connectionString})` เสมอ (ดู `frontend/lib/prisma.ts`) เขียนสคริปต์ probe แบบ `new PrismaClient()` เปล่า ๆ จะพังทันที และสคริปต์ต้องวางใน `frontend/` ถึงจะ resolve โมดูลเจอ
