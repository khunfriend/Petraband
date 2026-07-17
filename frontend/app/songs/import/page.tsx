import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/songs");

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="mb-6">
        <p className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-1">
          นำเข้าเพลง
        </p>
        <h1 className="text-2xl font-bold text-ink">Import จาก Excel</h1>
        <p className="text-sm text-muted mt-1">
          อัปโหลดไฟล์ .xlsx เพื่อนำเข้าข้อมูลเพลงและโน้ตเพลงแบบ bulk
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
