import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EquipmentClient from "./EquipmentClient";
import InstrumentEquipmentTab from "./InstrumentEquipmentTab";
import EquipmentTabs from "./EquipmentTabs";

export const metadata = { title: "อุปกรณ์ · PETRAband" };

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; type?: string; condition?: string }>;
}) {
  const { tab = "list", search = "", type = "", condition = "" } = await searchParams;
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const equipment = await prisma.equipment.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
      ...(type && { type }),
      ...(condition && {
        condition: condition as "GOOD" | "FAIR" | "NEEDS_REPAIR" | "RETIRED",
      }),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="mb-6">
        <p className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-1">
          คลังอุปกรณ์
        </p>
        <h1 className="text-2xl font-bold text-ink">อุปกรณ์</h1>
      </div>

      <EquipmentTabs activeTab={tab}>
        {{
          list: <EquipmentClient equipment={equipment} isAdmin={isAdmin} />,
          settings: <InstrumentEquipmentTab isAdmin={isAdmin} />,
        }}
      </EquipmentTabs>
    </div>
  );
}
