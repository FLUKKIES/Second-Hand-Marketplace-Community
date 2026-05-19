# CLAUDE.md — Group Mart

Social Mart: a second-hand marketplace and community platform (Thai language project).

## Tech Stack

- **Backend:** NestJS 11 + TypeScript, modular architecture
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** PostgreSQL with `pgvector` extension (columns exist, search disabled)
- **ORM:** Prisma 7 (uses `@prisma/adapter-pg` — required by generated client)
- **Real-time:** Socket.io (chat, notifications)
- **Auth:** Passport-JWT + Google OAuth2, Argon2 password hashing
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Package Manager:** pnpm 10+
- **Containerization:** Docker Compose with profiles (`dev` / `prod`)
- **AI:** Gemini API (`gemini-embedding-001`, `gemini-2.0-flash`) — files kept in `src/common/ai/gemini/` but semantic search is currently disabled to reduce costs

## Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema (Users, Posts, Products, Orders, Offers, etc.)
│   │   ├── seed.ts            # Seed data
│   │   └── migrations/        # Migration files
│   ├── prisma.config.ts       # Prisma 7 config (causes generated client to require adapter-pg)
│   └── src/
│       ├── main.ts            # Entry point
│       ├── app.module.ts      # Root module
│       └── common/
│           ├── ai/
│           │   ├── gemini/    # Gemini AI integration (kept for future use)
│           │   └── ollama/    # Ollama integration (kept for future use)
│           ├── auth/          # JWT + Google OAuth, guards, decorators
│           ├── config/        # Multer config
│           ├── database/prisma/ # PrismaService (uses adapter-pg)
│           ├── notification/  # Notification gateway + service
│           ├── search/        # Basic keyword search (vector search disabled)
│           └── upload/        # File upload controller/service
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components (shadcn/ui based)
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities (axios, etc.)
│   └── types/                 # TypeScript type definitions
├── infra/
│   └── gcp/
│       └── nginx.gcp.conf     # Nginx config for GCP VM (HTTP only, strips /api prefix)
├── .github/workflows/
│   ├── ci-backend.yml         # Backend CI
│   └── ci-frontend.yml        # Frontend CI
└── docker-compose.yml         # Single file with profiles
```

## Docker Compose Profiles

```bash
# Local development (starts Postgres + PgAdmin)
docker compose --profile dev up -d

# Production (GCP VM) — requires backend/.env and frontend/.env
docker compose --profile prod up -d
```

`--profile prod` builds and runs: **backend + frontend + nginx**. Does NOT include Postgres (uses Cloud SQL).

## Key Domain Concepts

- **Users** can be both buyers and sellers. They have profiles, addresses, bank accounts, and a reliability score.
- **Categories → Groups:** hierarchical structure (e.g., Sports → Running Shoes). Admins manage categories; users join groups.
- **Posts:** two types — General Post and Selling Post (with stock/price). Support likes, comments, and keyword search.
- **Offer System:** buyer-seller negotiation with counter-offers (`counterCount`, `lastCounteredBy`). Accepted offers create orders.
- **Order flow:** Offer accepted → Order created → Payment slip uploaded → Seller confirms → Ship → Receive → Complete → Review.
- **Real-time:** Socket.io for 1-on-1 chat and live notifications (offers, order updates, warnings).

## Local Development Setup

1. Copy `.env.example` to `.env` and configure.
2. `docker compose --profile dev up -d` — starts Postgres + PgAdmin.
3. Backend: `cd backend && pnpm install && pnpm prisma migrate dev && pnpm run start:dev` (port 3001).
4. Frontend: `cd frontend && pnpm install && pnpm run dev` (port 3000).

## GCP Production Setup

1. Create Cloud SQL PostgreSQL 16 instance (disable SSL enforcement for HTTP deployments).
2. Create `backend/.env` and `frontend/.env` on the VM (see `.env.example` for reference).
3. `docker compose --profile prod up -d` — pulls images and starts containers.
4. `docker exec marketplace-backend npx prisma migrate deploy` — run migrations.
5. `docker exec marketplace-backend npx prisma db seed` — seed initial data.

### backend/.env (production)
```env
DATABASE_URL=postgresql://USER:PASS@CLOUD_SQL_IP:5432/postgres
NODE_ENV=production
COOKIE_SECURE=false          # false = HTTP, true = HTTPS only
GEMINI_API_KEY=...
FRONTEND_URL=http://VM_IP
GOOGLE_CALLBACK_URL=http://VM_IP/api/auth/google/callback
```

## Common Commands

| Command | Description |
|---|---|
| `pnpm run start:dev` | Start backend in watch mode |
| `pnpm prisma migrate dev` | Apply DB migrations (dev) |
| `pnpm prisma migrate deploy` | Apply DB migrations (prod) |
| `pnpm prisma db seed` | Seed sample data |
| `pnpm prisma generate` | Regenerate Prisma client |
| `pnpm run build` | Build backend |
| `docker compose --profile dev up -d` | Start local dev infrastructure |
| `docker compose --profile prod up -d` | Start production containers |

## Backend Conventions

- **Modules:** each domain area has its own NestJS module with controller, service, and `dto/` folder.
- **DTOs:** use `class-validator` + `class-transformer` for validation. DTOs live in `dto/` subdirectories.
- **Auth:** JWT stored in HTTP-only cookies. `COOKIE_SECURE=true` for HTTPS, `false` for HTTP.
- **Prisma:** `PrismaService` uses `@prisma/adapter-pg` (required by the generated client due to `prisma.config.ts`). Do NOT remove the adapter — it will break with `PrismaClientInitializationError`.
- **File uploads:** Multer config in `common/config/multer.config.ts`.

## Frontend Conventions

- **App Router:** pages in `app/` directory.
- **Forms:** `react-hook-form` + `zod` validation.
- **Styling:** Tailwind CSS v4 with `@theme` and `oklch` color space. shadcn/ui components.
- **API calls:** centralized axios instance in `lib/api.ts` with `withCredentials: true`.
- **Real-time:** `socket.io-client` for chat and notifications.
- **`NEXT_PUBLIC_API_URL=/api`** in production (nginx strips `/api` and proxies to backend).

## Database Notes

- Uses `pgvector` extension — `embedding vector(3072)` columns exist on `posts` and `products` tables.
- Semantic search is **disabled** (columns are unpopulated). Basic ILIKE keyword search is used instead.
- To re-enable semantic search: restore Gemini embedding calls in `posts.service.ts` and vector search in `search.service.ts`.