# แผนการพัฒนา PETRAband v2

**เวอร์ชัน:** 1.0
**วันที่เริ่ม:** 2026-06-30
**อ้างอิง:** `PRD_ระบบจัดการวงดนตรีไทย.md`, `PETRAband-design-analysis.md`

---

## ภาพรวม Phase

| Phase | ชื่อ | เป้าหมาย | สถานะ |
|---|---|---|---|
| 0 | Foundation & Setup | โครงสร้าง project, design system, DB | ✅ เสร็จ |
| 1 | Auth & Member Profile | สมัคร/เข้าระบบ/โปรไฟล์ | ✅ เสร็จ |
| 2 | Song Library | เพลง + กริดโน้ต + Import Excel | ✅ เสร็จ |
| 3 | Performances & RSVP | งานแสดง, ปฏิทิน, RSVP | ✅ เสร็จ |
| 4 | Practice Schedule | ตารางซ้อม + ตอบความพร้อม + สรุปยอด | ⬜ |
| 5 | Running Order & Instrument Booking | ลำดับเพลง + จองคิวเครื่องดนตรี | ⬜ |
| 6 | Stage Layout | ผังเวที + version + export | ⬜ |
| 7 | Admin Tools | audit log + รายงานอัตราซ้อม + จัดการสมาชิก | ⬜ |
| 8 | Equipment Inventory | คลังอุปกรณ์ | ⬜ |
| 9 | Sheet Music Editor | สมุดโน้ตเพลงแบบ spreadsheet + export xlsx | ⬜ |
| 10 | Polish & Deploy | PDF export, optimization, deploy | ⬜ |

**Legend:** ⬜ ยังไม่เริ่ม · 🟡 กำลังทำ · ✅ เสร็จ · ⏸️ พัก

---

## Phase 0 — Foundation & Setup

**เป้าหมาย:** เตรียมโครงสร้างพื้นฐานทั้งหมดก่อนเริ่มเขียน feature

### Tasks

- [x] 0.1 เลือก tech stack — Next.js 16 + TypeScript + Tailwind v4 + Prisma 7 + PostgreSQL 16
- [x] 0.2 สร้าง Next.js project ใน `frontend/`
- [x] 0.3 ตั้งค่า Tailwind CSS + import design tokens จาก `PETRAband-design-analysis.md` (สี/typography/spacing/radius)
- [x] 0.4 เพิ่ม font Roboto + Sarabun จาก `fonts/` เข้า project พร้อมตั้งค่า `@font-face`
- [x] 0.5 สร้าง component library พื้นฐาน: Button (primary/coral/secondary), Input, Card, Badge
- [x] 0.6 สร้าง Top Navigation + Layout shell (parchment canvas, navy ink)
- [x] 0.7 Backend ใช้ Next.js API routes (built-in)
- [x] 0.8 ออกแบบ Database Schema ครบทุก table (User, Song, Performance, RSVP, Instrument, SongAssignment, StageLayout, StageLayoutVersion, Rehearsal, Equipment, AuditLog)
- [x] 0.9 ตั้งค่า Prisma 7 + schema validate ผ่าน
- [x] 0.10 ตั้งค่า Docker / docker-compose สำหรับ dev (PostgreSQL 16 + app)
- [ ] 0.11 ตั้งค่า Git workflow + `.gitignore` + README

---

## Phase 1 — Auth & Member Profile

**เป้าหมาย:** ผู้ใช้สมัคร/เข้าระบบและจัดการโปรไฟล์ได้ (FR-1.x)

### Tasks

- [ ] 1.1 ออกแบบ schema: User (id, email, password_hash, nickname, generation, primary_instrument, secondary_instrument, role)
- [ ] 1.2 API: POST /auth/register
- [ ] 1.3 API: POST /auth/login (JWT หรือ session-based)
- [ ] 1.4 API: POST /auth/logout
- [ ] 1.5 Middleware ตรวจ session + role-based access
- [ ] 1.6 หน้า Login UI (parchment + coral focus ring)
- [ ] 1.7 หน้า Register UI (เลือกเครื่องดนตรีหลัก/รอง, รุ่น #17/#สมทบ)
- [ ] 1.8 หน้า Profile (ดู/แก้ไขข้อมูลตัวเอง)
- [ ] 1.9 หน้า Performance History (FR-1.3) — ดึงจาก instrument booking
- [ ] 1.10 Seed admin user สำหรับ dev/test

---

## Phase 2 — Song Library

**เป้าหมาย:** จัดการเพลง โน้ตเพลง และ Import จาก Excel (FR-3.x)

### Tasks

- [ ] 2.1 Schema: Song (id, code, title, category, duration, created_at, updated_at)
- [ ] 2.2 Schema: SheetData (jsonb เก็บ rows/cols ตามรูปแบบใน `songs_full_export.json`)
- [ ] 2.3 Migrate ข้อมูลจาก `songs_full_export.json` เข้า DB
- [ ] 2.4 API: GET /songs (พร้อม search non-case-sensitive + filter ตาม category)
- [ ] 2.5 API: GET /songs/:id (รวม sheetData)
- [ ] 2.6 API: POST /songs, PUT /songs/:id, DELETE /songs/:id
- [ ] 2.7 หน้า Song List (search bar + category tabs)
- [ ] 2.8 หน้า Song Detail (แสดงกริดโน้ต + meta data)
- [ ] 2.9 Component: NotationGrid — กริด 8 ห้อง × 4 ช่อง = 32 ช่อง/บรรทัด (FR-3.7)
- [ ] 2.10 Notation Grid editing mode: รับ text อิสระต่อช่อง + Tab/Enter navigation (FR-3.8, 3.9)
- [ ] 2.11 เพิ่ม/ลบบรรทัด (FR-3.10)
- [ ] 2.12 Admin micro-adjust: แก้ทีละช่อง inline (FR-3.5)
- [ ] 2.13 หน้า Import Excel — upload + preview + column mapping (FR-3.6)
- [ ] 2.14 Validator แจ้งแถวที่ข้อมูลผิดรูปแบบ
- [ ] 2.15 Export PDF ต่อเพลง (FR-3.4) — Phase 8 หากซับซ้อน

---

## Phase 3 — Performances & RSVP

**เป้าหมาย:** จัดการงานแสดง ปฏิทิน และ RSVP (FR-2.x, FR-4.1–4.5)

### Tasks

- [x] 3.1 Schema: Performance (id, name, description, location)
- [x] 3.2 Schema: PerformanceDate (id, performance_id, date, start_time, end_time)
- [x] 3.3 Schema: PerformanceSong (performance_id, song_id, order)
- [x] 3.4 Schema: RSVP (user_id, performance_date_id, status: available/unavailable/pending)
- [x] 3.5 API CRUD Performance + PerformanceDate
- [x] 3.6 API: GET /performances/calendar (สำหรับปฏิทิน)
- [x] 3.7 API: POST /rsvp + GET /rsvp/me
- [x] 3.8 หน้า Performance List (แสดงงานแสดงทั้งหมด FR-4.1)
- [x] 3.9 หน้า Create Performance (เลือกหลายวันที่ FR-4.2)
- [x] 3.10 หน้า Performance Detail — รายการเพลง (FR-4.4)
- [x] 3.11 ค้นหาและเพิ่มเพลงเข้างาน (FR-4.3)
- [x] 3.12 RSVP UI — ตอบรายวัน (FR-4.5)
- [x] 3.13 Dashboard (FR-2.1, 2.2, 2.3) — สรุปงาน/ซ้อม/RSVP

---

## Phase 4 — Practice Schedule (ตารางซ้อม)

**เป้าหมาย:** สร้าง/ตอบตารางซ้อมที่ผูกกับงานแสดง + สรุปความพร้อมแบบ real-time (FR-5.2)

### ความสัมพันธ์กับ Phase อื่น
- **ต้องการ Phase 3** — ดึงรายการงานแสดง + รายชื่อสมาชิกในงาน
- **ส่งต่อ Phase 7** — ข้อมูล availability ช่วย Admin คำนวณรายงานอัตราการเข้าซ้อม
- **ส่งต่อ Dashboard** — วันซ้อมที่ใกล้ถึงแสดงบน Dashboard สมาชิก

### Schema
- [ ] 4.1 Schema: `PerformanceMember` (performance_id, user_id, group_label) — รายชื่อสมาชิกในงานแสดง
- [ ] 4.2 Schema: `PracticeSchedule` (id, performance_id, created_by_id, created_at)
- [ ] 4.3 Schema: `PracticeDay` (id, schedule_id, date)
- [ ] 4.4 Schema: `PracticeSlot` (id, day_id, start_time, end_time, label, is_special) — `is_special` ใช้ highlight สีพิเศษ
- [ ] 4.5 Schema: `PracticeMemberGroup` (id, schedule_id, name, display_order) — แบ่งกลุ่มในตาราง เช่น "การลอง", "นางรำ"
- [ ] 4.6 Schema: `PracticeGroupMember` (group_id, user_id)
- [ ] 4.7 Schema: `PracticeAvailability` (slot_id, user_id, is_available) — unique(slot_id, user_id)

### API
- [ ] 4.8 API: `POST /performance/:id/members` — เพิ่มสมาชิกเข้างานแสดง (Admin/Head)
- [ ] 4.9 API: `GET /performance/:id/members` — รายชื่อสมาชิกในงาน
- [ ] 4.10 API: `POST /practice-schedules` — สร้างตารางซ้อมพร้อม days + slots + groups (Admin/Head)
- [ ] 4.11 API: `GET /practice-schedules?performance_id=` — ดึงรายการตารางต่องาน
- [ ] 4.12 API: `GET /practice-schedules/:id` — ตารางเต็ม: days, slots, groups, members, availability ทุก user
- [ ] 4.13 API: `PUT /practice-schedules/:id` — แก้ไขตาราง (Admin/Head)
- [ ] 4.14 API: `DELETE /practice-schedules/:id`
- [ ] 4.15 API: `POST /practice-schedules/:id/availability` — สมาชิกบันทึก checkbox ตัวเอง
- [ ] 4.16 API: `GET /practice-schedules/:id/summary` — จำนวนคนว่างต่อ slot (ใช้ใน summary row)
- [ ] 4.17 API: `GET /practice-schedules/:id/response-status` — ใครตอบ/ยังไม่ตอบ (Admin/Head)
- [ ] 4.18 API: `GET /dashboard/upcoming-practices` — slot ซ้อมที่กำลังจะถึงของสมาชิก

### UI — สร้างตาราง (Admin/Head)
- [ ] 4.19 หน้า Create Practice Schedule — dropdown เลือกงาน (แสดงเฉพาะงานที่ยังไม่ถึง)
- [ ] 4.20 Component: `DateMultiPicker` — เลือกหลายวันที่ได้อิสระ
- [ ] 4.21 Component: `DaySlotEditor` — เพิ่ม/ลบ/เรียง slot ต่อวัน, กำหนด start/end time, label, toggle `is_special`
- [ ] 4.22 Component: `MemberGroupManager` — สร้างกลุ่ม, กำหนดชื่อกลุ่ม, เพิ่มสมาชิกเข้ากลุ่ม
- [ ] 4.23 PerformanceMember UI — หน้าจัดการรายชื่อสมาชิกในงาน (เพิ่ม/ลบ)

### UI — ตารางหลัก (PracticeGrid)
- [ ] 4.24 Component: `PracticeGrid` — ตาราง 2 แกน: rows = สมาชิกแบ่งตามกลุ่ม, cols = วัน + slot
- [ ] 4.25 Column headers: สีแบ่งตามวัน (คล้าย Excel เดิม), slot ที่ `is_special` ใช้สี accent ต่างจากปกติ
- [ ] 4.26 Cell = checkbox ว่าง/ไม่ว่าง — สมาชิกติ๊กได้เฉพาะแถวตัวเอง, Admin เห็นทุกแถว
- [ ] 4.27 Optimistic UI checkbox + auto-save เมื่อติ๊ก (debounce 300ms)
- [ ] 4.28 Summary row ล่างตาราง — แสดง `n/total` คนว่างต่อ slot, highlight slot ที่มีคนว่างน้อย
- [ ] 4.29 Admin response-status panel — badge/progress bar แสดงใครตอบแล้ว / ยังไม่ตอบ
- [ ] 4.30 Performance Detail: แท็บ "ตารางซ้อม" แสดงแต่ละ schedule เป็น sub-tab แยก (เหมือน sheet ใน Excel)

### UI — Dashboard & Integration
- [ ] 4.31 Dashboard widget: upcoming practice slots 7 วันข้างหน้าของสมาชิก (วัน + เวลา + ชื่องาน)
- [ ] 4.32 เชื่อม `PracticeAvailability` กับ Admin Report ใน Phase 7 (อัตราการตอบ / วิเคราะห์ช่วงที่ทุกคนว่าง)

---

## Phase 5 — Running Order & Instrument Booking

**เป้าหมาย:** ลำดับเพลงในโชว์ + ระบบจองคิวเครื่องดนตรีที่กันชนกัน (FR-4.6–4.11) [เดิม Phase 4]

### Tasks

- [ ] 5.1 Schema: Instrument (id, name, allows_concurrent: bool)
- [ ] 5.2 Schema: SongAssignment (performance_song_id, user_id, instrument_id)
- [ ] 5.3 Seed instrument list + กำหนด `allows_concurrent` (เช่น ระนาดทุ้ม)
- [ ] 5.4 API: PUT /performance/:id/running-order (drag-drop order)
- [ ] 5.5 API: POST /song-assignment (พร้อม validation กันซ้ำ FR-4.11)
- [ ] 5.6 หน้า Running Order Editor (dnd-kit หรือคล้ายกัน FR-4.6)
- [ ] 5.7 ดึง `duration` จาก Song + คำนวณเวลารวม (FR-4.7, 4.8)
- [ ] 5.8 UI เลือกสมาชิก + เลือกเครื่องดนตรี (FR-4.9, 4.10)
- [ ] 5.9 Real-time validation conflict (NFR-4) — optimistic UI + server validation
- [ ] 5.10 แสดงรายการ assignment ต่อเพลงพร้อมเตือนเมื่อ conflict

---

## Phase 6 — Stage Layout

**เป้าหมาย:** ผังเวที dynamic + version history + export (FR-4.12–4.17) [เดิม Phase 5]

### Tasks

- [ ] 6.1 Schema: StageLayout (id, performance_id, width, height, current_version_id)
- [ ] 6.2 Schema: StageLayoutVersion (id, layout_id, snapshot_json, created_by, created_at) — append-only
- [ ] 6.3 Schema: StageTemplate (id, name, layout_json) — สำหรับ template ใช้ซ้ำ
- [ ] 6.4 API CRUD StageLayout + commit version
- [ ] 6.5 API: GET version history + restore
- [ ] 6.6 API: save/load Template
- [ ] 6.7 Component: StageGrid — grid n×m รับ drag-drop instrument icons
- [ ] 6.8 Icon scale ตามขนาด grid (FR-4.13)
- [ ] 6.9 หน้า Stage Layout Editor
- [ ] 6.10 Version history viewer + restore UI (FR-4.14)
- [ ] 6.11 Template picker UI (FR-4.15)
- [ ] 6.12 Export PDF — date + รายการเพลง + ผังเวที (FR-4.16)
- [ ] 6.13 Export PNG/JPG (FR-4.17) — html-to-image หรือ Puppeteer
- [ ] 6.14 Role check: section lead แก้ได้เฉพาะเครื่องตนเอง (FR-5.4)

---

## Phase 7 — Admin Tools

**เป้าหมาย:** รายงานอัตราซ้อม (จาก Phase 4), จัดการสมาชิก, audit log (FR-5.x) [เดิม Phase 6]

### Tasks

- [ ] 7.1 Schema: AuditLog (id, user_id, action, target_type, target_id, payload, created_at) — append-only
- [ ] 7.2 API: GET /reports/attendance — อัตราการตอบตารางซ้อม + วิเคราะห์ช่วงที่ทุกคนว่าง (ดึงจาก PracticeAvailability Phase 4)
- [ ] 7.3 API: GET /admin/members (FR-5.1)
- [ ] 7.4 API: GET /audit-log (FR-5.5)
- [ ] 7.5 Middleware: เขียน audit log อัตโนมัติเมื่อแก้ stage layout / practice schedule
- [ ] 7.6 หน้า Admin Members List (จัดการ role, กลุ่ม, รุ่น)
- [ ] 7.7 หน้า Attendance Report — สถิติต่อสมาชิก: อัตราตอบตาราง, ช่วงที่ว่างบ่อย (ข้อมูลจาก Phase 4)
- [ ] 7.8 หน้า Audit Log viewer
- [ ] 7.9 Section Lead role + permission enforcement

---

## Phase 8 — Equipment Inventory

**เป้าหมาย:** คลังอุปกรณ์ (FR-6.x) [เดิม Phase 7]

### Tasks

- [ ] 8.1 ยืนยันโครงสร้างคอลัมน์ "รายการ (B-C)" จากไฟล์ Excel ต้นฉบับ
- [ ] 8.2 Schema: Equipment (id, name, quantity, type, condition, length_cm, width_cm, height_cm, note)
- [ ] 8.3 API CRUD Equipment
- [ ] 8.4 หน้า Equipment List + search/filter
- [ ] 8.5 หน้า Add/Edit Equipment form
- [ ] 8.6 Import จาก Excel (ถ้าจำเป็น)

---

## Phase 9 — Sheet Music Editor (สมุดโน้ตเพลง)

**เป้าหมาย:** ระบบแก้ไขโน้ตเพลงแบบ spreadsheet — ไม่มีสูตรคำนวณ ใช้จดโน้ตดนตรีไทยเป็นหลัก (FR-8.x)

### ความสัมพันธ์กับ Phase อื่น
- **เชื่อมกับ Phase 2** — แทนที่หรือเสริม `sheetData JSON` ใน Song Library
- **ใช้ใน Phase 3** — โน้ตเพลงแต่ละเพลงในงานแสดงเปิดดูผ่าน editor นี้

### Database

- [ ] 9.1 Schema: `Notebook` (id, song_id?, name, created_at, updated_at) — workbook ต่อเพลง
- [ ] 9.2 Schema: `Sheet` (id, notebook_id, name, sheet_order, column_count, row_count)
- [ ] 9.3 Schema: `Cell` (id, sheet_id, row_index, col_index, cell_value) — sparse storage เก็บเฉพาะเซลล์ที่มีข้อมูล
- [ ] 9.4 Schema: `CellStyle` (id, cell_id, font_family, font_size, is_bold, is_italic, is_underline, text_align, text_color, highlight_color) — 1:1 กับ Cell
- [ ] 9.5 Schema: `MergedCell` (id, sheet_id, start_row, start_col, end_row, end_col)
- [ ] 9.6 Schema: `ColumnWidth` (sheet_id, col_index, width_px) — sparse, ถ้าไม่มี record = ใช้ค่า default
- [ ] 9.7 Schema: `RowHeight` (sheet_id, row_index, height_px) — sparse

### API

- [ ] 9.8 API: `GET /notebooks?songId=` — ดึง notebook ของเพลง
- [ ] 9.9 API: `POST /notebooks` — สร้าง notebook ใหม่
- [ ] 9.10 API: `GET /notebooks/:id/sheets` — ดึงทุก sheet ใน notebook
- [ ] 9.11 API: `POST /notebooks/:id/sheets` — เพิ่ม sheet ใหม่
- [ ] 9.12 API: `GET /sheets/:id` — ดึงข้อมูล sheet เต็ม (cells + styles + merges + widths + heights)
- [ ] 9.13 API: `PATCH /sheets/:id/cells` — batch update cells (ส่งเฉพาะ cell ที่เปลี่ยน)
- [ ] 9.14 API: `PATCH /sheets/:id/styles` — batch update cell styles
- [ ] 9.15 API: `POST /sheets/:id/merges` — merge cells
- [ ] 9.16 API: `DELETE /sheets/:id/merges/:mergeId` — unmerge
- [ ] 9.17 API: `PATCH /sheets/:id/columns` — batch update column widths
- [ ] 9.18 API: `PATCH /sheets/:id/rows` — batch update row heights
- [ ] 9.19 API: `POST /sheets/:id/export/xlsx` — export เป็น .xlsx

### UI — Editor หลัก

- [ ] 9.20 Component: `SheetEditor` — ตาราง grid หลัก คล้าย Excel (keyboard navigation, click-to-edit)
- [ ] 9.21 Cell editing: double-click หรือ F2 เพื่อแก้ไข, Tab/Enter เลื่อน cell, Escape ยกเลิก
- [ ] 9.22 รองรับ Thai IME — ไม่ตัดอักขระระหว่างพิมพ์ (compositionstart/end events)
- [ ] 9.23 Component: `Toolbar` — ปุ่ม Bold, Italic, Underline, Align, Font, FontSize, Highlight color picker
- [ ] 9.24 Component: `SheetTabs` — แท็บ sheet ด้านล่าง เพิ่ม/ลบ/rename sheet ได้
- [ ] 9.25 เพิ่ม/ลบแถว: right-click context menu หรือปุ่มด้านข้าง
- [ ] 9.26 เพิ่ม/ลบคอลัมน์: right-click context menu หรือปุ่มด้านบน
- [ ] 9.27 ปรับขนาดคอลัมน์: drag border ระหว่าง column header
- [ ] 9.28 ปรับขนาดแถว: drag border ระหว่าง row header
- [ ] 9.29 Merge cell: เลือกหลาย cell แล้วกด merge ใน toolbar หรือ context menu
- [ ] 9.30 Highlight: color picker เลือกสีพื้นหลัง cell ได้
- [ ] 9.31 Auto-save: debounce 500ms หลังหยุดพิมพ์ส่ง PATCH อัตโนมัติ

### UI — Export & Integration

- [ ] 9.32 ปุ่ม Export .xlsx ใน toolbar — เรียก API แล้ว download ไฟล์ (FR-8.11)
- [ ] 9.33 เชื่อม Song Detail (Phase 2) — ปุ่ม "เปิดสมุดโน้ต" นำไปยัง SheetEditor ของเพลงนั้น

---

## Phase 10 — Polish, Export & Deploy

**เป้าหมาย:** เก็บงาน + deploy production [เดิม Phase 8]

### Tasks

- [ ] 10.1 ตรวจ Thai font rendering ใน PDF export ทุกจุด (NFR-2)
- [ ] 10.2 ทดสอบ concurrent booking (NFR-4) — load test
- [ ] 10.3 Responsive testing (mobile/tablet/desktop)
- [ ] 10.4 Accessibility audit (focus state, keyboard nav, contrast)
- [ ] 10.5 Performance optimization (image, font subsetting, code split)
- [ ] 10.6 Error tracking (Sentry หรือคล้ายกัน)
- [ ] 10.7 Backup strategy สำหรับ DB
- [ ] 10.8 ตั้งค่า CI/CD
- [ ] 10.9 Dockerfile + production deploy (Docker Hub / VPS / Vercel)
- [ ] 10.10 เขียน user manual / onboarding doc

---

## Open Issues (จาก PRD)

- [ ] รายการเครื่องดนตรีที่ `allows_concurrent` ครบทั้งหมด — รอยืนยันจากวง
- [ ] ชุดสัญลักษณ์พิเศษในโน้ตเพลง — รอรวบรวม
- [ ] ความหมายคอลัมน์ "รายการ" ในตารางอุปกรณ์ — รอไฟล์ Excel ต้นฉบับ

---

## บันทึกความก้าวหน้า (Changelog)

| วันที่ | ผู้แก้ | สรุป |
|---|---|---|
| 2026-06-30 | initial | สร้างแผนแรก ครบ 8 phase |
| 2026-06-30 | phase-0 | Phase 0 เสร็จ: Next.js 16 + Tailwind v4 + design tokens + fonts + base components (Button/Input/Card/Badge) + TopNav + layout + Prisma schema (13 tables) + Docker compose |
| 2026-07-02 | planning | แทรก Phase 4 Practice Schedule (32 tasks) + เลื่อน Phase 4–8 → 5–9 + ปรับ Phase 7 Admin Tools ให้รับข้อมูลจาก Phase 4 |
| 2026-07-16 | planning | เพิ่ม Phase 9 Sheet Music Editor (33 tasks, FR-8.x) + เลื่อน Phase 9 → 10 |

