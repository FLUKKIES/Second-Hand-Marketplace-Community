# Social Mart Backend (NestJS + Prisma)

NestJS API สำหรับแพลตฟอร์ม Social Mart รองรับ Marketplace, Community, Real-time Chat และ OAuth

## Prerequisites
- Node.js 20+ และ pnpm 10+
- PostgreSQL 15+ (แนะนำใช้ `docker compose up -d postgres pgadmin` จากโฟลเดอร์ root)
- ตั้งค่าไฟล์ `.env` ภายใต้ `backend/`

## Environment Variables (`backend/.env`)
```
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace?schema=public
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRATION=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/redirect
```

## Setup & Run (Dev)
```bash
pnpm install
pnpm prisma migrate dev --schema prisma/schema.prisma   # apply migrations
pnpm prisma db seed --schema prisma/schema.prisma       # optional seed data
pnpm run start:dev                                      # http://localhost:$PORT
```

## NPM Scripts
- `start` / `start:dev` / `start:prod` — รันแอปแบบปกติ, watch mode, หรือ production
- `build` — สร้างโค้ดเป็น `dist/`
- `lint` — ตรวจ eslint และแก้ไขอัตโนมัติ
- `test`, `test:e2e`, `test:cov` — Unit, e2e, และ coverage

## โครงสร้างหลัก
- `src/` — โมดูลของแอป (auth, chat, marketplace, community ฯลฯ)
- `prisma/` — `schema.prisma`, migrations, และ seed script
- `test/` — e2e tests
- `dist/` — ไฟล์ build หลังรัน `pnpm run build`

## เพิ่มเติม
- ค่าเริ่มต้น API base URL: `http://localhost:3001`
- อย่าลืมสร้างโฟลเดอร์อัปโหลด (ถ้ามีการใช้ multer) ตาม path ที่กำหนดในโค้ดก่อนรันบนโปรดักชัน
