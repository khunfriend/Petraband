import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-6xl font-bold text-primary leading-none tabular-nums">404</p>
          <h1 className="text-xl font-bold text-ink">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="text-sm text-muted leading-relaxed">
            หน้าอาจถูกย้ายหรือลบไปแล้ว ลองกลับไปหน้าหลักหรือย้อนกลับ
          </p>
          <div className="flex gap-2 mt-2">
            <Link href="/">
              <Button variant="primary" size="sm">กลับหน้าหลัก</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
