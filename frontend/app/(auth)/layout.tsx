import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-1 min-h-screen grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <aside className="bg-surface-dark text-on-dark px-6 py-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-12 lg:py-12 flex lg:flex-col lg:justify-center lg:items-center gap-4">
        <Link href="/" className="inline-flex items-center gap-3 lg:flex-col lg:gap-4">
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={160}
            height={160}
            className="rounded-full w-10 h-10 lg:w-40 lg:h-40"
          />
          <span className="text-lg lg:text-2xl font-semibold text-white">PETRAband</span>
        </Link>
      </aside>

      <div className="flex items-center justify-center px-6 py-12 lg:px-16 bg-bone">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
