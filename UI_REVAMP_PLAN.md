# PETRAband — UI Revamp Plan

แผนปรับ UI ทั้งระบบให้อิงตาม `design-only.md` โดยใช้หน้า `/design` (สไตล์ claude.com/product/design) เป็น visual reference

---

## 0. หลักการที่ต้องยึด (ตัดสินใจเมื่อสับสน)

จาก `design-only.md`:
1. **Parchment เท่านั้นเป็นพื้นหลังหลัก** — ห้าม pure white
2. **Navy 700 = 95% ของน้ำหนักภาพ, Coral 500 ใช้ได้ 1 จุด/viewport**
3. **ไม่มี drop shadow** ทุกที่ — สื่อ elevation ด้วยโทนพื้น + hairline 1px + accent border
4. **ไม่ใช้ gradient** ยกเว้น navy overlay บาง ๆ บน hero
5. **Motion**: 120/200/320/600ms + `--pb-ease` — ห้าม bouncy
6. **Bilingual**: ไทย/อังกฤษซ้อนบรรทัด หรือคั่นด้วย `·`
7. **Icon**: Lucide stroke 1.75px — ห้าม emoji / filled / mixed stroke

---

## 1. Audit สภาพปัจจุบัน

### หน้าที่มี
| Route | ไฟล์ | สถานะ |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard สำหรับ user ที่ login แล้ว |
| `/dashboard` | `app/dashboard/` | Calendar view |
| `/members` | `app/members/` | รายชื่อสมาชิก + detail |
| `/songs` | `app/songs/` | รายการเพลง + detail + import |
| `/performances` | `app/performances/` | รายการงานแสดง + detail + create |
| `/equipment` | `app/equipment/` | อุปกรณ์ (tabs) |
| `/notebooks/[id]` | `app/notebooks/` | สมุดโน้ต |
| `/profile` | `app/profile/` | โปรไฟล์ผู้ใช้ |
| `/login` `/forgot-password` `/reset-password` | `app/(auth)/` | Auth |
| `/design` | `app/design/` | ✅ ใหม่ — reference visual |

### Component ที่มีอยู่ใน `components/ui/`
`AlertBox` · `Badge` · `Button` · `Card` · `ConfirmDialog` · `EmptyState` · `Eyebrow` · `Input` · `Modal` · `Skeleton` · `Toast`

### สิ่งที่ต้องตรวจก่อนเริ่ม
- [ ] เปิดทุกหน้าถ่าย screenshot before → ใช้เทียบตอนทำ
- [ ] Grep หา `shadow-` `drop-shadow` `bg-white` `#fff` `gradient` ที่อาจฝ่าฝืน rule
- [ ] Grep หา emoji ใน UI (`👋` `🎵` ฯลฯ) — แทนด้วย Lucide
- [ ] เช็คว่ามี `lucide-react` ติดตั้งหรือยัง (ตอนนี้ยังไม่มี → ตัดสินใจ: ติดตั้งหรือใช้ inline SVG)

---

## 2. Phase 1 — Foundation (ทำก่อนแตะหน้าอื่น)

**เป้า**: ให้ token / primitive แข็งแรงก่อน จะได้ไม่ต้องแก้ซ้ำ

### 2.1 Design tokens
- [ ] เช็ค `globals.css @theme` ให้ครบทุก token จาก `design-only.md §2–7`
  - เพิ่ม coral scale เต็ม (100–700) ที่ยังไม่มี
  - เพิ่ม blue scale, navy scale, slate scale ถ้ายังไม่ครบ
  - เพิ่ม type scale token `--pb-text-*` ทั้ง 11 ระดับ
  - เพิ่ม motion token `--pb-ease*`, `--pb-dur-*`
- [ ] ตรวจ Sarabun/Roboto ครบทุก weight ที่ใช้ (400/500/700)

### 2.2 Icon strategy
- [ ] **ตัดสินใจ**: ติดตั้ง `lucide-react` (recommend) หรือใช้ inline SVG stroke 1.75
  - ถ้าติดตั้ง — สร้าง wrapper กำหนด strokeWidth=1.75 เป็นค่า default
- [ ] แทน emoji ทุกจุดในโค้ดด้วย Lucide icon

### 2.3 Base components (refactor ทีละตัว)
| Component | สิ่งที่ต้องทำ |
|---|---|
| `Button` | variant: `primary` (navy filled) / `secondary` (hairline outline) / `ghost` / `danger`; size sm/md/lg; radius `md`; hover เปลี่ยนสีพื้น ไม่ใช่ shadow |
| `Card` | bg `surface-card`, border `hairline` 1px, radius `lg`, padding 24/32; variant `sunken` ใช้ `fog` bg |
| `Input` | bg `white`, border `hairline`, focus ring navy 1.5px (ไม่ใช่ box-shadow); radius `md` |
| `Badge` | pill, coral variant เอาไว้ใช้ 1 จุด, navy/slate variant ใช้ทั่วไป |
| `Modal` | scrim `rgba(11,37,64,0.42)` + `backdrop-blur(8px)` (exception เดียวที่อนุญาต shadow-like) |
| `Eyebrow` | 12px, weight 700, tracking `caps` 0.12em, สี coral (ตามที่ hero ใช้) |
| `EmptyState` | icon Lucide + navy heading + slate body + CTA primary |
| `Skeleton` | ใช้ `parchment-deep` เป็น base, animation 600ms |
| `AlertBox` | 4 variant semantic ตาม §2.8 (success/warning/danger/info) |
| `Toast` | slide-in 200ms `--pb-ease-out`, border-left 3px สีตาม semantic |

### 2.4 Shared layout
- [ ] `TopNav` — ตรวจให้ใช้ parchment, navy text, active state = coral underline หรือ navy border-bottom
- [ ] เพิ่ม `PageHeader` component: eyebrow + h1 + optional actions (ใช้ pattern เดียวทั้งเว็บ)
- [ ] เพิ่ม `SectionDivider` แบบคลื่น (SVG จาก `/design`) เอาไว้ใช้เป็นตัวคั่น section

---

## 3. Phase 2 — หน้าสาธารณะ (auth pages)

**เป้า**: หน้าที่ผู้ใช้ใหม่เห็นก่อน ต้อง on-brand ที่สุด

- [ ] `/login`
  - Split layout: ซ้าย form (bone bg) / ขวา visual navy พร้อม brand metaphor (เรือ + คลื่น + ริบบิ้น coral)
  - CTA `bg-primary`, secondary link ไป forgot-password
- [ ] `/forgot-password` `/reset-password`
  - Layout เดียวกับ login แต่ตัด visual panel เหลือแค่ eyebrow + h2 + form
- [ ] Error/success states ใช้ `AlertBox` variant semantic

---

## 4. Phase 3 — Dashboard / Home (`/` + `/dashboard`)

- [ ] `PageHeader`: eyebrow "PETRAband", h1 "สวัสดี, {name}"
- [ ] `DashboardCalendar`
  - พื้น `surface-card`, hairline border
  - Event pill: performance = navy filled, practice = navy outline, special = coral (1 ประเภทต่อวัน)
  - Today highlight = coral underline (ไม่ใช่ filled circle)
  - Weekday header: eyebrow style (12px, caps, tracking wide)
- [ ] เพิ่ม quick-stats strip ด้านบน (3 การ์ด hairline): งานเดือนนี้ · ซ้อมสัปดาห์นี้ · เพลงใหม่

---

## 5. Phase 4 — List/Detail pages

Pattern เดียวกันทุกหน้า:
```
┌ PageHeader (eyebrow + h1 + primary CTA) ┐
├ Filter/Search bar (hairline)             ┤
├ List grid/table (card variant)           ┤
└ EmptyState เมื่อไม่มีข้อมูล                ┘
```

### 5.1 `/members`
- [ ] Grid การ์ดสมาชิก: avatar circle, ชื่อ (navy bold), role (slate small), badge เครื่องดนตรี
- [ ] Detail: hero navy pane ด้านบน + tabs ประวัติ/เพลง/อุปกรณ์ (border-bottom active = navy 1.5px)

### 5.2 `/songs` + `/songs/[id]` + `/songs/import`
- [ ] List: table hairline dividers, hover row `parchment-soft`
- [ ] Detail: PageHeader + section การ์ด (แต่ละ section คั่นด้วย SectionDivider)
- [ ] Import: stepper 3 ขั้น (คล้าย "How It Works" ใน `/design`)

### 5.3 `/performances` + `/performances/[id]` + `/performances/create`
- [ ] List: การ์ดใหญ่ 2 คอลัมน์ (date badge coral 1 จุด เฉพาะงานถัดไป)
- [ ] Detail: hero navy + tabs (สมาชิก/เพลง/ตารางซ้อม/อุปกรณ์)
- [ ] Create form: multi-step wizard, sticky footer navy พร้อมปุ่ม "ย้อนกลับ / ถัดไป"

### 5.4 `/equipment`
- [ ] Tabs style เดียวกับ member detail
- [ ] Table hairline + badge สถานะ semantic

### 5.5 `/notebooks/[id]`
- [ ] Editor pane: `bg-bone` + parchment sidebar
- [ ] Toolbar: icon-only Lucide, hover `parchment-deep`

### 5.6 `/profile`
- [ ] Form 2 คอลัมน์บนจอกว้าง: ซ้าย avatar + upload, ขวา field
- [ ] แยก section "บัญชี / รหัสผ่าน / การแจ้งเตือน" ด้วย SectionDivider

---

## 6. Phase 5 — Polish

- [ ] เพิ่ม page transition 320ms fade (`--pb-ease`)
- [ ] Hero ทุกหน้าใช้ wave SVG divider คั่นก่อนเข้า content
- [ ] Empty state ทุกหน้ามี Lucide icon + copy สองบรรทัดไทย/อังกฤษ
- [ ] Accessibility: focus ring navy 1.5px ทุก interactive element (ไม่ใช้ browser default)
- [ ] `prefers-reduced-motion`: ปิด wave animation, ตัด duration เหลือ 0
- [ ] Meta/OG image ใช้ palette เดียวกัน

---

## 7. QA Checklist ก่อนถือว่าเสร็จแต่ละหน้า

- [ ] เปิดใน Chrome + Safari + mobile viewport
- [ ] Grep หา `shadow-` `bg-white` `gradient` `emoji` ในไฟล์นั้น = ต้องไม่มี
- [ ] มี coral **ไม่เกิน 1 จุด** ต่อ viewport
- [ ] ทุก interactive มี hover + focus visible ไม่ใช่ default browser
- [ ] Thai body ใช้ line-height 1.7
- [ ] ทดสอบ dark section (`surface-dark`) ว่า contrast ผ่าน WCAG AA

---

## 8. ลำดับแนะนำ (จากผลกระทบมากไปน้อย)

1. **Phase 1** (foundation) — 1 sprint
2. **Phase 3** (dashboard) — เห็นผลทุกครั้งที่ login
3. **Phase 2** (auth) — first impression
4. **Phase 4** (list/detail) — ทำทีละหน้า, songs/performances ก่อนเพราะใช้บ่อย
5. **Phase 5** (polish) — ทำคู่ขนานไปกับ 4

---

## 9. สิ่งที่ต้องคุยกันก่อน (open questions)

- [ ] ติดตั้ง `lucide-react` หรือใช้ inline SVG ตลอด?
- [ ] มี brand asset (เรือ/คลื่น/ริบบิ้น SVG) พร้อมใช้ไหม หรือต้อง commission?
- [ ] Wave divider ใน `/design` เอาไปใช้ทุกหน้าเลย หรือเก็บไว้เฉพาะ hero?
- [ ] Coral 1 จุด/viewport — ในหน้า list ที่มีหลาย item จะให้ coral อยู่ที่ไหน (เช่น "item ถัดไป", "unread", "highlighted")?
