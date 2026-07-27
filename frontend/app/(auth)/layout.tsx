import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-1 min-h-screen bg-bone flex flex-col px-6 py-10 md:px-12 md:py-14">
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
    </div>
  );
}
