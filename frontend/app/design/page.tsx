import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Design",
  description: "ไอเดียของคุณ ออกแบบร่วมกับ PETRAband",
};

// Lucide-style stroke icons (1.75px, no fill) — matches design-only §8
const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const features = [
  {
    title: "Prototypes",
    thai: "ต้นแบบ",
    body: "สร้างต้นแบบที่ใช้งานได้จริงจากไอเดียเริ่มต้น — เห็นภาพภายในไม่กี่นาที",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 20h8M12 18v2" />
      </svg>
    ),
  },
  {
    title: "Wireframes",
    thai: "โครงร่าง",
    body: "วางโครงสร้างหน้าตาแอปหรือเว็บก่อนลงรายละเอียด สื่อสารง่ายกับทีม",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    title: "Design explorations",
    thai: "สำรวจดีไซน์",
    body: "ทดลองหลายทิศทางในคราวเดียว เปรียบเทียบและเลือกทางที่ใช่",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </svg>
    ),
  },
  {
    title: "Design systems",
    thai: "ระบบดีไซน์",
    body: "สร้าง token, component และ pattern ที่ทีมนำไปต่อยอดได้ทั้งโปรเจกต์",
    icon: (
      <svg {...iconProps}>
        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
      </svg>
    ),
  },
  {
    title: "Iteration",
    thai: "ปรับปรุงต่อเนื่อง",
    body: "ปรับแก้ทีละคลื่น สั่งเปลี่ยนสี ระยะ หรือ layout ได้ทันทีที่คุยกัน",
    icon: (
      <svg {...iconProps}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
    ),
  },
  {
    title: "Handoff",
    thai: "ส่งต่อทีม dev",
    body: "แปลงดีไซน์เป็นโค้ดที่ใช้ token จริง — ทีม dev หยิบไปใช้ได้เลย",
    icon: (
      <svg {...iconProps}>
        <path d="M16 18l4-4-4-4M8 6l-4 4 4 4M14.5 4l-5 16" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: "บอกไอเดีย",
    en: "Describe the idea",
    body: "อธิบายสิ่งที่คุณอยากได้ด้วยภาษาธรรมชาติ — คำเดียว ประโยคเดียว หรือทั้งหน้าจอ",
  },
  {
    title: "เห็นตัวเลือก",
    en: "See variations",
    body: "รับตัวเลือกดีไซน์หลายทิศทางที่ยึดกับ brand token ของคุณ",
  },
  {
    title: "ปรับตามใจ",
    en: "Refine",
    body: "สั่งเปลี่ยนสี ระยะ typography หรือ layout ต่อได้แบบสนทนา",
  },
  {
    title: "ส่งออก",
    en: "Ship it",
    body: "ส่งออกเป็นโค้ด หรือส่งต่อทีม dev พร้อม design token ครบ",
  },
];

const testimonials = [
  {
    quote:
      "PETRAband ช่วยให้ทีมเราออกแบบระบบจัดการวงได้เร็วกว่าเดิม 3 เท่า — สื่อสารกันผ่านดีไซน์ ไม่ต้องเดา",
    name: "คุณอ้อม",
    role: "Music Director, วงเปตราแบนด์",
  },
  {
    quote:
      "การมี design token เดียวกันทั้งทีม ทำให้ผลงานเราออกมามีเอกลักษณ์ในทุก touchpoint",
    name: "Peter W.",
    role: "Lead Designer",
  },
];

const faqs = [
  {
    q: "PETRAband Design ต่างจากเครื่องมือดีไซน์ทั่วไปยังไง?",
    a: "เราเริ่มจาก brand metaphor ก่อน — เรือ คลื่น ริบบิ้น — แล้วแปลงเป็น token ที่ทีมทั้งหมดใช้ร่วมกันได้ ไม่ใช่แค่หน้าตาสวยแล้วจบ",
  },
  {
    q: "รองรับภาษาไทยเต็มรูปแบบไหม?",
    a: "รองรับเต็มรูปแบบ ใช้ Sarabun สำหรับไทยและ Roboto สำหรับอังกฤษ พร้อม line-height ที่ปรับให้พอดีกับสระบน-ล่าง",
  },
  {
    q: "ส่งต่อให้ทีม dev อย่างไร?",
    a: "ทุกดีไซน์มี design token เป็น CSS variable พร้อมใช้งาน ทีม dev เอาไปวางในโปรเจกต์ Tailwind หรือ CSS ได้ทันที",
  },
  {
    q: "เริ่มใช้งานยากไหม?",
    a: "ไม่ยาก เริ่มจากบอกเป้าหมายเป็นภาษาธรรมชาติ — เราจะพาไปทีละขั้น",
  },
];

export default function DesignPage() {
  return (
    <div className="w-full">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 pt-24 pb-32 md:pt-32 md:pb-40">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.12em] text-coral">
            PETRAband · Design
          </p>
          <h1 className="max-w-[900px] text-[48px] leading-[1.1] font-bold text-ink md:text-[84px]">
            ไอเดียของคุณ
            <br />
            ออกแบบร่วมกับ PETRAband
          </h1>
          <p className="mt-8 max-w-[620px] text-lg leading-[1.7] text-body md:text-xl">
            เปลี่ยนความคิดในหัวให้กลายเป็นดีไซน์ที่ใช้งานได้จริง —
            ยึดกับ brand token เดียวกันทั้งทีม ตั้งแต่ wireframe จนถึง handoff
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-on-primary transition-colors duration-200 hover:bg-primary-active"
            >
              เริ่มออกแบบ
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center rounded-md border border-hairline px-6 py-3 text-base font-medium text-ink transition-colors duration-200 hover:bg-surface-cream-strong"
            >
              ดูวิธีใช้งาน
            </Link>
          </div>
        </div>

        {/* Wave divider — สื่อ metaphor คลื่น */}
        <svg
          className="block h-16 w-full text-surface-cream-strong"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 40 Q 240 0 480 40 T 960 40 T 1440 40 V 80 H 0 Z"
            fill="currentColor"
          />
        </svg>
      </section>

      {/* ─── Features Grid ────────────────────────────── */}
      <section className="bg-surface-cream-strong">
        <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
          <div className="mb-16 max-w-[720px]">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-body-strong">
              Capabilities
            </p>
            <h2 className="text-3xl font-bold leading-tight text-ink md:text-[38px]">
              สิ่งที่ทำได้ในที่เดียว
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="group flex flex-col rounded-lg border border-hairline bg-surface-card p-8 transition-colors duration-200 hover:border-primary"
              >
                <div className="mb-6 text-primary">{f.icon}</div>
                <h3 className="text-xl font-bold text-ink">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.thai}</p>
                <p className="mt-4 text-base leading-[1.7] text-body">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────── */}
      <section id="how" className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
          <div className="mb-16 max-w-[720px]">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-body-strong">
              How it works · วิธีการทำงาน
            </p>
            <h2 className="text-3xl font-bold leading-tight text-ink md:text-[38px]">
              จากไอเดียถึงหน้าจอจริงใน 4 ขั้น
            </h2>
          </div>

          <ol className="divide-y divide-hairline-soft border-y border-hairline-soft">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="grid grid-cols-[auto_1fr] gap-6 py-8 md:grid-cols-[80px_240px_1fr] md:gap-10 md:py-10"
              >
                <div className="text-4xl font-bold text-primary md:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink md:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{s.en}</p>
                </div>
                <p className="col-span-2 text-base leading-[1.7] text-body md:col-span-1 md:text-lg">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────── */}
      <section className="bg-surface-dark text-on-dark">
        <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-on-dark-soft">
            เสียงจากผู้ใช้จริง
          </p>
          <h2 className="mb-16 text-3xl font-bold leading-tight md:text-[38px]">
            ทีมที่ออกแบบด้วย PETRAband
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-lg border border-surface-dark-elevated bg-surface-dark-soft p-8"
              >
                <blockquote className="text-lg leading-[1.7] text-on-dark md:text-xl">
                  <span className="text-coral">“</span>
                  {t.quote}
                  <span className="text-coral">”</span>
                </blockquote>
                <figcaption className="mt-6 border-t border-surface-dark-elevated pt-4">
                  <p className="font-medium text-on-dark">{t.name}</p>
                  <p className="text-sm text-on-dark-soft">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────── */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[960px] px-6 py-24 md:py-32">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-body-strong">
            FAQ · คำถามที่พบบ่อย
          </p>
          <h2 className="mb-16 text-3xl font-bold leading-tight text-ink md:text-[38px]">
            ยังสงสัยอยู่?
          </h2>

          <div className="border-t border-hairline">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group border-b border-hairline py-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium text-ink md:text-xl">
                  {f.q}
                  <svg
                    width={22}
                    height={22}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="mt-4 max-w-[720px] text-base leading-[1.7] text-body">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────── */}
      <section className="bg-surface-cream-strong">
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center md:py-32">
          <h2 className="mx-auto max-w-[720px] text-3xl font-bold leading-tight text-ink md:text-[48px]">
            พร้อมออกแบบร่วมกันหรือยัง?
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-lg leading-[1.7] text-body">
            เริ่มจากไอเดียเดียว แล้วปล่อยให้ PETRAband พาไปถึงหน้าจอที่ใช้ได้จริง
          </p>
          <Link
            href="/dashboard"
            className="mt-10 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-lg font-medium text-on-primary transition-colors duration-200 hover:bg-primary-active"
          >
            เริ่มใช้งาน
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
