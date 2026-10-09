import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-1 min-h-screen grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel — the night sky from the logo */}
      <aside className="relative overflow-hidden bg-surface-dark text-on-dark px-6 py-8 lg:px-14 lg:py-14 flex lg:flex-col justify-between gap-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(520px 320px at 90% 0%, rgb(201 162 75 / 0.2), transparent 70%), radial-gradient(480px 360px at 0% 100%, rgb(217 79 127 / 0.16), transparent 70%)",
          }}
        />
        <Link href="/" className="relative inline-flex items-center gap-3 self-start">
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={44}
            height={44}
            className="rounded-full ring-2 ring-gold/70 ring-offset-2 ring-offset-surface-dark"
          />
          <span className="font-display text-lg font-semibold tracking-wide text-white">PETRAband</span>
        </Link>

        <div className="relative hidden lg:flex flex-col gap-6">
          <Image
            src="/petraband-logo.png"
            alt=""
            aria-hidden
            width={220}
            height={220}
            className="rounded-full ring-1 ring-white/15 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.7)]"
          />
          <div className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              <span aria-hidden className="h-px w-6 bg-gold" />
              วงดนตรีไทย
            </p>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.15] text-white">
              เพลง งานแสดง
              <br />
              และการซ้อม ในที่เดียว
            </h1>
          </div>
        </div>

        <p className="relative hidden lg:block text-xs text-on-dark-soft">© PETRAband</p>
      </aside>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16 bg-bone">
        <div className="pb-reveal w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
