import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import EquipmentClient from "./EquipmentClient";
import InstrumentEquipmentTab from "./InstrumentEquipmentTab";
import EquipmentTabs from "./EquipmentTabs";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "อุปกรณ์ · PETRAband" };

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; type?: string }>;
}) {
  const { tab = "list", search = "", type = "" } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";
  const isHead = session.user.role === "HEAD";
  if (!isAdmin && !isHead) notFound();

  const equipment = await prisma.equipment.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
      ...(type && { type }),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      <PageHeader
        eyebrow="Equipment · อุปกรณ์"
        title="คลังอุปกรณ์"
        description="รายการอุปกรณ์ทั้งหมด และการตั้งค่าอุปกรณ์ต่องานแสดง"
      />

      <EquipmentTabs activeTab={tab}>
        {tab === "settings" ? (
          <InstrumentEquipmentTab isAdmin={isAdmin} />
        ) : (
          <EquipmentClient equipment={equipment} isAdmin={isAdmin} />
        )}
      </EquipmentTabs>
    </div>
  );
}
