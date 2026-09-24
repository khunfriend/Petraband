// How many of each accessory a performance needs, from the settings on the
// equipment page: perPlayer × people + Σ (players on a position × that
// position's count).

export type AccessoryType = { id: string; name: string; perPlayer: number };
export type InstrumentAccessories = { name: string; accessories: Record<string, number> };

export function accessoryTotals(
  types: AccessoryType[],
  rows: InstrumentAccessories[],
  people: number,
  playersPerPosition: Record<string, number>
): { id: string; name: string; count: number }[] {
  const byName = new Map(rows.map((r) => [r.name, r.accessories]));
  return types.map((t) => {
    let count = t.perPlayer * people;
    for (const [pos, players] of Object.entries(playersPerPosition)) {
      count += (byName.get(pos)?.[t.id] ?? 0) * players;
    }
    return { id: t.id, name: t.name, count };
  });
}
