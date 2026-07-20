import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const INSTRUMENTS = [
  // ปี่พาทย์ — actual cm from Petra Bible ÷ 100 = meters
  { name: "ranat-ek",       nameThai: "ระนาดเอก",     allowsConcurrent: false, footprintW: 1.25, footprintH: 0.41, iconType: "ranat" },
  { name: "ranat-thum",     nameThai: "ระนาดทุ้ม",    allowsConcurrent: true,  footprintW: 1.33, footprintH: 0.46, iconType: "ranat" },
  { name: "ranat-ek-lek",   nameThai: "ระนาดเอกเหล็ก", allowsConcurrent: false, footprintW: 1.25, footprintH: 0.41, iconType: "ranat" },
  { name: "ranat-thum-lek", nameThai: "ระนาดทุ้มเหล็ก", allowsConcurrent: true, footprintW: 1.33, footprintH: 0.46, iconType: "ranat" },
  { name: "khong-wong-yai", nameThai: "ฆ้องวงใหญ่",   allowsConcurrent: false, footprintW: 1.31, footprintH: 1.11, iconType: "khong" },
  { name: "khong-wong-lek", nameThai: "ฆ้องวงเล็ก",   allowsConcurrent: false, footprintW: 1.23, footprintH: 1.05, iconType: "khong" },
  // เครื่องเป่า — no floor footprint data; player footprint ~0.3 m
  { name: "pi-nai",         nameThai: "ปี่ใน",         allowsConcurrent: false, footprintW: 0.3,  footprintH: 0.3,  iconType: "pi" },
  { name: "pi-nok",         nameThai: "ปี่นอก",        allowsConcurrent: false, footprintW: 0.3,  footprintH: 0.3,  iconType: "pi" },
  { name: "pi-klang",       nameThai: "ปี่กลาง",       allowsConcurrent: false, footprintW: 0.3,  footprintH: 0.3,  iconType: "pi" },
  { name: "khlui-phiang-aw", nameThai: "ขลุ่ยเพียงออ", allowsConcurrent: false, footprintW: 0.3,  footprintH: 0.3,  iconType: "pi" },
  { name: "khlui-lib",      nameThai: "ขลุ่ยหลิบ",    allowsConcurrent: false, footprintW: 0.3,  footprintH: 0.3,  iconType: "pi" },
  // เครื่องสาย — ยาวรวมระยะสีคันชัก 104/102 cm; กว้างเพิ่มช่องนักดนตรี
  { name: "so-duang",       nameThai: "ซออู้",         allowsConcurrent: true,  footprintW: 1.04, footprintH: 0.5,  iconType: "so" },
  { name: "so-u",           nameThai: "ซอด้วง",        allowsConcurrent: true,  footprintW: 1.02, footprintH: 0.5,  iconType: "so" },
  { name: "so-sam-sai",     nameThai: "ซอสามสาย",     allowsConcurrent: true,  footprintW: 0.5,  footprintH: 0.5,  iconType: "so" },
  { name: "khim",           nameThai: "ขิม",           allowsConcurrent: true,  footprintW: 1.0,  footprintH: 0.35, iconType: "khim" },
  { name: "chakhe",         nameThai: "จะเข้",         allowsConcurrent: true,  footprintW: 1.36, footprintH: 0.45, iconType: "chakhe" },
  // ประกอบจังหวะ
  { name: "thon",           nameThai: "โทน",           allowsConcurrent: true,  footprintW: 0.25, footprintH: 0.25, iconType: "drum" },
  { name: "rammana",        nameThai: "รำมะนา",        allowsConcurrent: true,  footprintW: 0.25, footprintH: 0.25, iconType: "drum" },
  { name: "ching",          nameThai: "ฉิ่ง",          allowsConcurrent: false, footprintW: 0.2,  footprintH: 0.2,  iconType: "ching" },
  { name: "chap-lek",       nameThai: "ฉาบเล็ก",       allowsConcurrent: false, footprintW: 0.3,  footprintH: 0.3,  iconType: "ching" },
  { name: "chap-yai",       nameThai: "ฉาบใหญ่",       allowsConcurrent: false, footprintW: 0.5,  footprintH: 0.5,  iconType: "ching" },
  { name: "klong-that",     nameThai: "กลองทัด",       allowsConcurrent: true,  footprintW: 0.5,  footprintH: 0.5,  iconType: "drum" },
  { name: "klong-khaek",    nameThai: "กลองแขก",       allowsConcurrent: true,  footprintW: 0.65, footprintH: 0.3,  iconType: "drum" },
  { name: "ta-pone",        nameThai: "ตะโพน",         allowsConcurrent: false, footprintW: 0.5,  footprintH: 0.35, iconType: "drum" },
];

interface SongExport {
  id: string;
  songCode: string;
  title: string;
  category: string;
  duration: number | null;
  sheetData: string | object | null;
}

async function main() {
  console.log("🌱 Seeding instruments...");
  for (const instr of INSTRUMENTS) {
    await prisma.instrument.upsert({
      where: { name: instr.name },
      update: {
        nameThai: instr.nameThai,
        allowsConcurrent: instr.allowsConcurrent,
        footprintW: instr.footprintW ?? 0.5,
        footprintH: instr.footprintH ?? 0.5,
        iconType: instr.iconType ?? "default",
      },
      create: instr,
    });
  }
  console.log(`✅ ${INSTRUMENTS.length} instruments seeded`);

  console.log("🌱 Seeding admin user...");
  const passwordHash = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@petraband.club" },
    update: {},
    create: {
      email: "admin@petraband.club",
      passwordHash,
      nickname: "Admin",
      generation: "#สมทบ",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user: admin@petraband.club / admin1234");

  console.log("🌱 Seeding songs...");
  const exportPath = join(__dirname, "../../songs_full_export.json");
  let songs: SongExport[] = [];
  try {
    songs = JSON.parse(readFileSync(exportPath, "utf-8"));
  } catch {
    console.log("⚠️  songs_full_export.json not found — skipping songs seed");
  }

  let upserted = 0;
  for (const song of songs) {
    const sheetData =
      typeof song.sheetData === "string"
        ? JSON.parse(song.sheetData)
        : song.sheetData;

    await prisma.song.upsert({
      where: { songCode: song.songCode },
      update: {
        title: song.title,
        category: song.category ?? "ดนตรีไทย",
        duration: song.duration ?? null,
        sheetData: sheetData ?? undefined,
      },
      create: {
        songCode: song.songCode,
        title: song.title,
        category: song.category ?? "ดนตรีไทย",
        duration: song.duration ?? null,
        sheetData: sheetData ?? undefined,
      },
    });
    upserted++;
  }
  console.log(`✅ ${upserted} songs seeded`);

  // ─── Equipment ──────────────────────────────────────────────
  console.log("🌱 Seeding equipment...");

  const EQUIPMENT = [
    // ปี่พาทย์
    { name: "ระนาดเอก",       type: "เครื่องดนตรี ปี่พาทย์",     quantity: 2, brokenQuantity: 0, lengthCm: 125, widthCm: 41,  heightCm: 52,  note: "สีอ่อนของพี่เต" },
    { name: "ระนาดทุ้ม",      type: "เครื่องดนตรี ปี่พาทย์",     quantity: 2, brokenQuantity: 0, lengthCm: 133, widthCm: 46,  heightCm: 40,  note: "ขาเหล็กของพี่เต" },
    { name: "ฆ้องวงเล็ก",    type: "เครื่องดนตรี ปี่พาทย์",     quantity: 1, brokenQuantity: 0, lengthCm: 123, widthCm: 105, heightCm: 25,  note: "อ.เอก บริจาค" },
    { name: "ฆ้องวงใหญ่",    type: "เครื่องดนตรี ปี่พาทย์",     quantity: 2, brokenQuantity: 0, lengthCm: 131, widthCm: 111, heightCm: 26,  note: "สีอ่อนของพี่เต" },
    // เครื่องสาย
    { name: "จะเข้",          type: "เครื่องดนตรี เครื่องสาย",   quantity: 2, brokenQuantity: 0, lengthCm: 136, widthCm: 43,  heightCm: 28,  note: null },
    { name: "ขิม",            type: "เครื่องดนตรี เครื่องสาย",   quantity: 5, brokenQuantity: 0, lengthCm: 100, widthCm: 32,  heightCm: 21,  note: null },
    { name: "ขิม ขนาดเล็ก",  type: "เครื่องดนตรี เครื่องสาย",   quantity: 3, brokenQuantity: 0, lengthCm: 79,  widthCm: 32,  heightCm: null, note: null },
    { name: "ขิม ขนาดเล็กที่สุด", type: "เครื่องดนตรี เครื่องสาย", quantity: 1, brokenQuantity: 0, lengthCm: 54,  widthCm: 25,  heightCm: null, note: null },
    { name: "ซออู้",          type: "เครื่องดนตรี เครื่องสาย",   quantity: 2, brokenQuantity: 2, lengthCm: 104, widthCm: 13,  heightCm: 81,  note: "ความยาวรวมระยะการสีคันชักทั้งเข้าและออก" },
    { name: "ซอด้วง",         type: "เครื่องดนตรี เครื่องสาย",   quantity: 2, brokenQuantity: 2, lengthCm: 102, widthCm: 13,  heightCm: 75,  note: "ความยาวรวมระยะการสีคันชักทั้งเข้าและออก" },
    { name: "ซอสามสาย",      type: "เครื่องดนตรี เครื่องสาย",   quantity: 0, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: "ยืมเขามา" },
    // เครื่องเป่า
    { name: "ขลุ่ย",          type: "เครื่องดนตรี เครื่องเป่า",  quantity: 7, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: "ระมัดระวัง หมายถึงอย่าใช้ร่วมกับผู้อื่น" },
    { name: "แคน",            type: "เครื่องดนตรี เครื่องเป่า",  quantity: 1, brokenQuantity: 0, lengthCm: 15,  widthCm: 5,   heightCm: 98,  note: null },
    { name: "แคนจิ๋ว",        type: "เครื่องดนตรี เครื่องเป่า",  quantity: 1, brokenQuantity: 0, lengthCm: 12,  widthCm: 4,   heightCm: 45,  note: null },
    // ประกอบจังหวะ
    { name: "กลองแขกตัวผู้",  type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 28,  widthCm: 28,  heightCm: 64,  note: null },
    { name: "กลองแขกตัวเมีย", type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 28,  widthCm: 28,  heightCm: 64,  note: null },
    { name: "ตะโพน",          type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 48,  widthCm: 35,  heightCm: 55,  note: null },
    { name: "กลองทัดเสียงต่ำ", type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 0, brokenQuantity: 0, lengthCm: 45,  widthCm: 45,  heightCm: 50,  note: "ยืมเขามา" },
    { name: "กลองทัดเสียงสูง", type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 0, brokenQuantity: 0, lengthCm: 45,  widthCm: 45,  heightCm: 50,  note: "ยืมเขามา" },
    { name: "ระฆังราว",       type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 58,  widthCm: 57,  heightCm: 107, note: null },
    { name: "ฉาบใหญ่",        type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 50,  widthCm: 50,  heightCm: 107, note: null },
    { name: "ฉิ่ง",           type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    { name: "โทนรำมะนา",     type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 24,  widthCm: 24,  heightCm: 43,  note: null },
    { name: "คาฮอง",          type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: 29,  widthCm: 30,  heightCm: 50,  note: null },
    { name: "ฉาบเล็ก",        type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 2, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    { name: "กรับเสภา",       type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 2, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    { name: "กรับพวง",        type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    { name: "แทมบูรีน",       type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    { name: "ลูกแซ็ก",        type: "เครื่องดนตรี ประกอบจังหวะ", quantity: 1, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    // อุปกรณ์
    { name: "เก้าอี้พลาสติก", type: "อุปกรณ์",                   quantity: 40, brokenQuantity: 0, lengthCm: 35,  widthCm: 35,  heightCm: 45,  note: null },
    { name: "ผ้าคลุมเก้าอี้", type: "อุปกรณ์",                   quantity: 35, brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
    { name: "ขาตั้งโน๊ต",     type: "อุปกรณ์",                   quantity: 33, brokenQuantity: 0, lengthCm: 46,  widthCm: 38,  heightCm: 145, note: null },
    { name: "ป้ายวง",         type: "อุปกรณ์",                   quantity: 1,  brokenQuantity: 0, lengthCm: 76,  widthCm: 21,  heightCm: 43,  note: null },
    { name: "เครื่องเป่าลมร้อน", type: "อุปกรณ์",               quantity: 1,  brokenQuantity: 0, lengthCm: null, widthCm: null, heightCm: null, note: null },
  ];

  for (const eq of EQUIPMENT) {
    const existing = await prisma.equipment.findFirst({ where: { name: eq.name } });
    if (existing) {
      await prisma.equipment.update({
        where: { id: existing.id },
        data: {
          type: eq.type,
          quantity: eq.quantity,
          brokenQuantity: eq.brokenQuantity,
          lengthCm: eq.lengthCm,
          widthCm: eq.widthCm,
          heightCm: eq.heightCm,
          note: eq.note,
        },
      });
    } else {
      await prisma.equipment.create({ data: eq });
    }
  }
  console.log(`✅ ${EQUIPMENT.length} equipment items seeded`);

  console.log("✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
