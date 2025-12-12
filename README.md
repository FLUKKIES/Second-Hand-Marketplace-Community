# 🛍️ Social Mart — Second Hand Marketplace & Community

แพลตฟอร์มซื้อขายของมือสองและคอมมูนิตี้ที่รวม Marketplace, Social Interaction และ Real-time Chat ไว้ด้วยกัน

## ไฮไลต์ฟีเจอร์
- Marketplace: โพสต์ขายหลายชิ้นในโพสต์เดียว, หมวดหมู่แบบลำดับชั้น, Bundle ออเดอร์, แจ้งโอน/แนบสลิป
- Community: โพสต์ถาม-ตอบ, กด Like/Comment, ระบบรีวิวผู้ขาย
- Chat: แชท 1-1 ผ่าน Socket.io และแนบ Order Request ได้
- Security: Login Email/Password + Google OAuth, JWT, จัดการโปรไฟล์และที่อยู่จัดส่ง

## Tech Stack
- Backend: NestJS 11 + Prisma
- Database: PostgreSQL
- Real-time: Socket.io
- Auth: Passport-JWT, Google OAuth2
- Tooling: pnpm, Docker Compose (สำหรับ Postgres + PgAdmin)

## โครงสร้างโปรเจกต์
```bash
.
├── backend/          # NestJS API
├── frontend/         # (เตรียมไว้สำหรับเว็บแอป)
├── docker-compose.yml# Postgres + PgAdmin
└── README.md
```

## สิ่งที่ต้องมี
- Node.js 20+ และ pnpm 10+
- Docker + Docker Compose (สำหรับฐานข้อมูล)
- PostgreSQL (ถ้าไม่ใช้ Docker)

## Quick Start (Dev)
1) สร้างไฟล์ `.env` ที่ root สำหรับ Docker Compose  
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketplace
POSTGRES_PORT=5432
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=changeme
PGADMIN_PORT=5050
```
2) เปิดบริการฐานข้อมูล  
`docker compose up -d postgres pgadmin`

3) ติดตั้งและเตรียม Backend  
```bash
cd backend
pnpm install
pnpm prisma migrate dev        # apply migrations
pnpm prisma db seed            # (ถ้าต้องการข้อมูลตัวอย่าง)
pnpm run start:dev             # เริ่ม API ที่ http://localhost:3001
```

4) ข้อมูลเพิ่มเติมสำหรับการตั้งค่า Backend และตัวแปรสภาพแวดล้อมดูที่ `backend/README.md`

## คำสั่งที่ใช้บ่อย
- ปิดบริการ Docker: `docker compose down`
- ดู log Postgres: `docker compose logs -f postgres`
- ตรวจสอบสถานะคอนเทนเนอร์: `docker compose ps`
