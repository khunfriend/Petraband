# วิธีรัน PETRAband (Local)

## เริ่มต้น
```bash
docker compose up -d
```
เข้าใช้งาน: **http://localhost:3003**

## หยุด (ข้อมูลยังอยู่)
```bash
docker compose stop
```

## เริ่มใหม่หลัง stop
```bash
docker compose up -d
```

---

## Ports
| Service | Port |
|---------|------|
| App (Next.js) | 3003 |
| PostgreSQL | 5434 |

## ครั้งแรกเท่านั้น — Run Migration
```bash
cd frontend && DATABASE_URL="postgresql://petraband:petraband@localhost:5434/petraband?schema=public" npx prisma migrate deploy
```

---

## คำสั่งอื่น ๆ
```bash
# ดู logs
docker compose logs app --tail=50

# Build ใหม่ (หลังแก้โค้ด)
docker compose up --build -d

# ลบ containers (ข้อมูลยังอยู่)
docker compose down

# ลบทุกอย่างรวม database ❌
docker compose down -v
```
