import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold text-ink">404</h1>
      <p className="text-muted">ไม่พบหน้าที่คุณต้องการ</p>
      <Link href="/dashboard" className="text-coral hover:underline text-sm">กลับหน้าหลัก →</Link>
    </div>
  );
}
