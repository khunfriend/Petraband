import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-64px)]">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Link href="/">
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={64}
            height={64}
            className="rounded-full"
          />
        </Link>
        <span className="text-xl font-bold text-ink tracking-tight">PETRAband</span>
        <span className="text-sm text-muted">ระบบจัดการวงดนตรีไทย</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
