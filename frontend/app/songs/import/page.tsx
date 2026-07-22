import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/songs");

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted"
      >
        <Link
          href="/songs"
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)]"
        >
          คลังเพลง
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <span className="text-ink font-medium">นำเข้า Excel</span>
      </nav>

      <PageHeader
        eyebrow="Import · นำเข้า"
        title="นำเข้าเพลงจาก Excel"
        description="อัปโหลดไฟล์ .xlsx เพื่อนำเข้าข้อมูลเพลงและโน้ตเพลงแบบ bulk"
      />

      <ImportClient />
    </div>
  );
}
