# PETRAband Design (Visual Only)

สรุปเฉพาะส่วนที่เป็น **ดีไซน์ / ความสวยงาม** จาก `design-system.md`

---

## 1. Brand Metaphor

เรือไวกิ้งแล่นผ่านคลื่นหลายชั้น มีริบบิ้นสีคอรัลพันอยู่
- เรือ = วง
- คลื่น = ดนตรีต่างวัฒนธรรม
- ริบบิ้น = ดนตรีไทยที่ร้อยเรียงทุกอย่างเข้าด้วยกัน

---

## 2. Color Palette

### 2.1 Primary Brand
| Token | Hex | ใช้เมื่อ |
|---|---|---|
| `--pb-navy-700` | `#1B3A6B` | สีหลัก, ปุ่ม primary, หัวข้อ |
| `--pb-navy-900` | `#0B2540` | ตัวอักษรบนพื้น parchment |
| `--pb-coral-500` | `#DD5085` | Accent — ใช้ 1 ครั้ง/viewport |

### 2.2 Navy Scale
| Token | Hex |
|---|---|
| `--pb-navy-600` | `#244B82` |
| `--pb-navy-700` | `#1B3A6B` |
| `--pb-navy-800` | `#122E55` |
| `--pb-navy-900` | `#0B2540` |
| `--pb-ink` | `#0F1E33` |

### 2.3 Blue Scale (คลื่น/ท้องฟ้า)
| Token | Hex |
|---|---|
| `--pb-blue-50` | `#E6EEF6` |
| `--pb-blue-100` | `#C5D5E5` |
| `--pb-blue-200` | `#A6C7E0` |
| `--pb-blue-300` | `#6BA8D6` |
| `--pb-blue-400` | `#4A8BC4` |
| `--pb-blue-500` | `#3A6FA8` |

### 2.4 Coral Scale (ริบบิ้น)
| Token | Hex |
|---|---|
| `--pb-coral-100` | `#FCE6EE` |
| `--pb-coral-200` | `#F8CCDB` |
| `--pb-coral-300` | `#F1A0BE` |
| `--pb-coral-400` | `#E8709E` |
| `--pb-coral-500` | `#DD5085` |
| `--pb-coral-600` | `#D04C77` |
| `--pb-coral-700` | `#B8395E` |

### 2.5 Parchment / Bone (พื้นหลังหลัก)
| Token | Hex | ใช้เมื่อ |
|---|---|---|
| `--pb-parchment` | `#F1ECDF` | พื้นหน้าเว็บหลัก |
| `--pb-parchment-soft` | `#F7F3EA` | พื้นรอง |
| `--pb-parchment-deep` | `#E6DFCB` | พื้นลึก |
| `--pb-bone` | `#FAF7F0` | Card บน parchment |
| `--pb-fog` | `#EFE9DC` | Surface sunken |
| `--pb-white` | `#FFFFFF` | Input, floating surface |

### 2.6 Slate / Neutral
| Token | Hex |
|---|---|
| `--pb-slate-50` | `#F4F6F9` |
| `--pb-slate-100` | `#E8ECF1` |
| `--pb-slate-200` | `#D6DCE4` |
| `--pb-slate-300` | `#B6BFCC` |
| `--pb-slate-500` | `#6F7E94` |
| `--pb-slate-700` | `#44546D` |
| `--pb-slate-900` | `#1F2B3E` |

### 2.7 Borders
| Token | Hex |
|---|---|
| `--pb-border` | `#D8D0BD` |
| `--pb-border-soft` | `#E5DECC` |
| `--pb-divider` | `#E0D8C4` |

### 2.8 Semantic Feedback
| Token | Fg | Bg |
|---|---|---|
| Success | `#2E8765` | `#E0F0E7` |
| Warning | `#C8881A` | `#FBF0D6` |
| Danger | `#C0392B` | `#FBE3DF` |
| Info | `#3A6FA8` | `#E6EEF6` |

---

## 3. Typography

### 3.1 Font Families
- **Roboto** สำหรับอังกฤษ
- **Sarabun** สำหรับไทย
- ห้ามใช้ฟอนต์อื่น

### 3.2 Type Scale
| Token | Size |
|---|---|
| `--pb-text-xs` | 12px |
| `--pb-text-sm` | 14px |
| `--pb-text-base` | 16px |
| `--pb-text-md` | 18px |
| `--pb-text-lg` | 20px |
| `--pb-text-xl` | 24px |
| `--pb-text-2xl` | 30px |
| `--pb-text-3xl` | 38px |
| `--pb-text-4xl` | 48px |
| `--pb-text-5xl` | 64px |
| `--pb-text-6xl` | 84px |

### 3.3 Weights
- regular = 400
- medium = 500
- bold = 700

### 3.4 Line Height
- tight = 1.15
- snug = 1.30
- normal = 1.50
- loose = 1.70 *(body ภาษาไทยเท่านั้น)*

### 3.5 Letter Spacing
- tight = -0.01em
- normal = 0
- wide = 0.04em
- caps = 0.12em *(สำหรับ "PETRAband" lockup)*

### 3.6 Heading Styles
| Class | Size | Weight | Color |
|---|---|---|---|
| `.pb-h1` | 64px | 700 | navy-900 |
| `.pb-h2` | 38px | 700 | navy-900 |
| `.pb-h3` | 30px | 700 | navy-800 |
| `.pb-h4` | 24px | 500 | navy-800 |
| `.pb-eyebrow` | 12px | 700 | coral-500 (caps) |
| `.pb-lead` | 20px | — | slate-700 |
| `.pb-p` | 16px | 400 | navy-900 |
| `.pb-small` | 14px | — | slate-700 |
| `.pb-caption` | 12px | — | slate-500 (uppercase) |

---

## 4. Spacing (4px base)

| Token | Value |
|---|---|
| `--pb-space-0` | 0 |
| `--pb-space-1` | 4px |
| `--pb-space-2` | 8px |
| `--pb-space-3` | 12px |
| `--pb-space-4` | 16px |
| `--pb-space-5` | 20px |
| `--pb-space-6` | 24px |
| `--pb-space-8` | 32px |
| `--pb-space-10` | 40px |
| `--pb-space-12` | 48px |
| `--pb-space-16` | 64px |
| `--pb-space-20` | 80px |
| `--pb-space-24` | 96px |

---

## 5. Border Radius

| Token | Value | ใช้กับ |
|---|---|---|
| `--pb-radius-xs` | 4px | — |
| `--pb-radius-sm` | 6px | — |
| `--pb-radius-md` | 10px | Button, input, small card |
| `--pb-radius-lg` | 16px | Card, section |
| `--pb-radius-xl` | 24px | Hero card |
| `--pb-radius-2xl` | 32px | — |
| `--pb-radius-pill` | 999px | Badge, chip |
| `--pb-radius-circle` | 50% | Avatar, logo |

---

## 6. Elevation & Shadow

**ไม่ใช้ drop shadow** — ทุก shadow = `none`

สื่อ elevation ด้วย:
1. โทนพื้นผิว (parchment → bone → white → navy)
2. Hairline border 1px
3. Accent border (navy หรือ coral 1.5px)

Exception: Modal ใช้ `backdrop-filter: blur(8px)` + scrim `rgba(11,37,64,0.42)`

---

## 7. Motion

| Token | Value | ใช้เมื่อ |
|---|---|---|
| `--pb-ease` | `cubic-bezier(0.22,0.61,0.36,1)` | Default (คลื่น) |
| `--pb-ease-out` | `cubic-bezier(0.16,1,0.30,1)` | Entry animations |
| `--pb-ease-in-out` | `cubic-bezier(0.65,0,0.35,1)` | Two-way |
| `--pb-dur-fast` | 120ms | Tap |
| `--pb-dur-base` | 200ms | Hover / state |
| `--pb-dur-slow` | 320ms | Drawer / menu |
| `--pb-dur-voyage` | 600ms | Hero wave, page transition |

**ห้าม**: bouncy / spring easing

---

## 8. Iconography

- **Library**: Lucide
- **Stroke**: 1.75px
- **Preferred glyphs**: music, compass, ship, waves, flag, users
- **ห้าม**: emoji, filled icons, mixed stroke widths

---

## 9. Layout / Visual Rules

1. **Parchment ต้องเป็นพื้นหลังหลัก** — ห้ามใช้ pure white แทน
2. **Navy 700 = 95% ของน้ำหนักภาพ, Coral 500 = 1 จุด/viewport**
3. **ไม่ใช้ gradient** ยกเว้น navy overlay บาง ๆ บน hero
4. **Bilingual**: วางไทยกับอังกฤษเป็นสองบรรทัดซ้อน หรือคั่นด้วย `·`
