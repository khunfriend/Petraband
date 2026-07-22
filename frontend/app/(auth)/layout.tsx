import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
      {/* ─── Left: form pane (bone bg) ─────────────────── */}
      <div className="bg-bone flex flex-col px-6 py-10 md:px-12 md:py-14">
        <Link href="/" className="inline-flex items-center gap-2.5 self-start">
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-sm font-bold text-ink tracking-tight">PETRAband</span>
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px] py-10">{children}</div>
        </div>

        <p className="text-xs text-muted-soft self-start">
          © PETRAband · ระบบจัดการวงดนตรีไทย
        </p>
      </div>

      {/* ─── Right: brand visual (navy 900) — hidden on mobile ─── */}
      <aside
        aria-hidden
        className="hidden lg:flex relative overflow-hidden bg-[color:var(--color-navy-900)] text-on-dark flex-col justify-between p-12"
      >
        {/* Layered wave SVG — เรือแล่นผ่านคลื่น */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {/* คลื่นลึก (navy-800) */}
          <path
            d="M0 620 Q 200 560 400 620 T 800 620 V 1000 H 0 Z"
            fill="var(--color-navy-800)"
          />
          {/* คลื่นกลาง (navy-700) */}
          <path
            d="M0 720 Q 200 660 400 720 T 800 720 V 1000 H 0 Z"
            fill="var(--color-navy-700)"
          />
          {/* คลื่นตื้น (blue-500 opacity) */}
          <path
            d="M0 820 Q 200 780 400 820 T 800 820 V 1000 H 0 Z"
            fill="var(--color-blue-500)"
            opacity="0.6"
          />
          {/* ริบบิ้นคอรัลพันผ่าน — coral 1 จุด/viewport */}
          <path
            d="M -50 500 Q 200 380 400 500 T 850 480"
            fill="none"
            stroke="var(--color-coral-500)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* เรือ (silhouette เรียบ) */}
          <g transform="translate(340 440)">
            {/* body */}
            <path
              d="M -60 30 Q -50 55 0 55 Q 50 55 60 30 Z"
              fill="var(--color-parchment)"
              opacity="0.95"
            />
            {/* mast */}
            <line
              x1="0"
              y1="30"
              x2="0"
              y2="-50"
              stroke="var(--color-parchment)"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* sail */}
            <path
              d="M 0 -50 L 40 25 L 0 25 Z"
              fill="var(--color-parchment)"
              opacity="0.85"
            />
            <path
              d="M 0 -50 L -40 25 L 0 25 Z"
              fill="var(--color-parchment)"
              opacity="0.7"
            />
          </g>
        </svg>

        {/* Foreground content */}
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-coral-500)]">
            Petra · เรือ · คลื่น · ริบบิ้น
          </p>
          <h2 className="mt-4 text-3xl xl:text-4xl font-bold leading-tight max-w-[420px]">
            เรือไวกิ้งแล่นผ่านคลื่นหลายชั้น
            <br />
            <span className="text-on-dark-soft">ร้อยด้วยดนตรีไทย</span>
          </h2>
        </div>

        <div className="relative z-10">
          <p className="text-sm leading-[1.7] text-on-dark-soft max-w-[400px]">
            ระบบจัดการวงดนตรีที่ผสานวัฒนธรรมหลายทิศทาง —
            ตั้งแต่คิวงานแสดง ตารางซ้อม จนถึงคลังโน้ตเพลง
          </p>
        </div>
      </aside>
    </div>
  );
}
