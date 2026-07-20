import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import EquipmentClient from "./EquipmentClient";
import InstrumentEquipmentTab from "./InstrumentEquipmentTab";
import EquipmentTabs from "./EquipmentTabs";
import LoansClient from "./LoansClient";

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
  const canEdit = isAdmin || isHead;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">คลังอุปกรณ์</h1>
      </div>

      <EquipmentTabs activeTab={tab}>
        {tab === "settings" ? (
          <InstrumentEquipmentTab isAdmin={isAdmin} />
        ) : tab === "borrowed-in" || tab === "lent-out" ? (
          <LoansTabContent direction={tab === "borrowed-in" ? "BORROWED_IN" : "LENT_OUT"} canEdit={canEdit} />
        ) : (
          <EquipmentListTab search={search} type={type} isAdmin={isAdmin} />
        )}
      </EquipmentTabs>
    </div>
  );
}

async function EquipmentListTab({ search, type, isAdmin }: { search: string; type: string; isAdmin: boolean }) {
  const equipment = await prisma.equipment.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
      ...(type && { type }),
    },
    include: {
      loans: {
        where: { direction: "LENT_OUT", returnedAt: null },
        select: { id: true, quantity: true, counterparty: true, borrowedAt: true, note: true },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const items = equipment.map((eq) => {
    const lentOut = eq.loans.reduce((s, l) => s + l.quantity, 0);
    return {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      quantity: eq.quantity,
      brokenQuantity: eq.brokenQuantity,
      lengthCm: eq.lengthCm,
      widthCm: eq.widthCm,
      heightCm: eq.heightCm,
      note: eq.note,
      lentOut,
      lentOutLoans: eq.loans.map((l) => ({
        id: l.id,
        quantity: l.quantity,
        counterparty: l.counterparty,
        borrowedAt: l.borrowedAt.toISOString(),
        note: l.note,
      })),
    };
  });

  return <EquipmentClient equipment={items} isAdmin={isAdmin} />;
}

async function LoansTabContent({ direction, canEdit }: { direction: "BORROWED_IN" | "LENT_OUT"; canEdit: boolean }) {
  const [loans, equipment] = await Promise.all([
    prisma.equipmentLoan.findMany({
      where: { direction },
      orderBy: [{ returnedAt: "asc" }, { borrowedAt: "desc" }],
    }),
    direction === "LENT_OUT"
      ? prisma.equipment.findMany({
          select: { id: true, name: true, type: true, quantity: true },
          orderBy: [{ type: "asc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const serialized = loans.map((l) => ({
    id: l.id,
    equipmentId: l.equipmentId,
    equipmentName: l.equipmentName,
    direction: l.direction,
    quantity: l.quantity,
    counterparty: l.counterparty,
    borrowedAt: l.borrowedAt.toISOString(),
    returnedAt: l.returnedAt ? l.returnedAt.toISOString() : null,
    note: l.note,
  }));

  return <LoansClient direction={direction} loans={serialized} equipment={equipment} canEdit={canEdit} />;
}
