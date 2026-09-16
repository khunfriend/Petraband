# WORKLOG

> ไฟล์สถานะงานสด — session ใหม่อ่านไฟล์นี้ก่อนเสมอ (ดู [CLAUDE.md](CLAUDE.md))
> อัปเดตทุกครั้งที่จบก้อนงาน ไม่ใช่ตอนจบ session อย่างเดียว

**อัปเดตล่าสุด:** 16 ก.ย. 2569 · commit ล่าสุด `8a95836`

---

## 🔴 กำลังทำอยู่

ยังไม่ได้เริ่มงานเขียนโค้ด — งานถัดไปคือซ่อมบั๊ก sheet editor (ดูหัวข้อถัดไป)

## ⏭️ ถัดไปคือ (เรียงตามลำดับที่ควรทำ)

### 1. 🐛 [P0] Undo ครั้งแรกล้างข้อมูลทั้งชีต

`frontend/components/sheets/SheetGrid.tsx:157` เริ่ม history ด้วย `[new Map()]` (Map ว่าง) ไม่ใช่เซลล์ที่โหลดมาจริง

ผลคือ: เปิดชีตที่มีข้อมูล → พิมพ์ 1 เซลล์ → history เป็น `[ว่าง, เต็ม]` → กด Ctrl+Z → ย้อนไป snapshot ว่าง → **เซลล์หายหมด** และ `saveCellDiff` (`:460`) เขียน `null` ลง DB ตามไปด้วย ไม่ใช่แค่หายบนจอ

**แนวทาง:** seed `historyRef` ด้วย snapshot ของ `cells` ตอน mount แทน Map ว่าง

### 2. Copy / Cut (paste มีแล้ว แต่ copy ไม่มี)

`handlePaste` (`SheetGrid.tsx:520`) รับ TSV จาก Excel ได้แล้ว แต่ไม่มี `onCopy`/`onCut` เลย และตารางเป็น `select-none` (`:986`) → Ctrl+C ไม่ได้อะไรติดมา ต้องเขียน handler เอง แปลง selection เป็น TSV

### 3. Delete Row / Column ไม่เลื่อนข้อมูล

`deleteRow` (`:878`) / `deleteCol` (`:919`) แค่ล้างค่าในแถวเป้าหมายแล้วลด count → ข้อมูลข้างล่างไม่เลื่อนขึ้น ผลคือแถวสุดท้ายหายแทนแถวที่เลือก
ประเด็นเดียวกัน: `addRow`/`addCol` ต่อท้ายอย่างเดียว แทรกกลางไม่ได้

### 4. ขยาย Undo ให้ครอบ style / merge / resize

ตอนนี้ `pushHistory` ถูกเรียกเฉพาะตอนแก้ค่าเซลล์ (`commitEdit`, `handlePaste`, ปุ่ม Delete) ไม่ครอบ `applyStyle`, `mergeCells`, resize, เพิ่ม/ลบแถว และไม่มีปุ่ม undo/redo บน toolbar

### 5. [ต้อง migrate DB] Border / จัดบน-กลาง-ล่าง / Wrap Text

`CellStyle` ทั้งใน `frontend/components/sheets/types.ts` และ `schema.prisma` **ไม่มีฟิลด์** `border*`, `verticalAlign`, `wrapText` → ทำ UI อย่างเดียวไม่พอ ต้อง migration ก่อน
(`whiteSpace: "nowrap"` hardcode อยู่ที่ `SheetGrid.tsx:1060`)

### 6. ยังไม่มี: move row/col, drag-drop ข้อมูล, fill handle, ลบ format, ปุ่ม A+/A-

---

## ✅ เสร็จแล้ว

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
