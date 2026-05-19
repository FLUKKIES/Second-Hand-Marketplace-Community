# CLAUDE.md — Group Mart

Social Mart: a second-hand marketplace and community platform (Thai language project).

## Tech Stack

- **Backend:** NestJS 11 + TypeScript, modular architecture
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** PostgreSQL with `pgvector` extension (AI vector search)
- **ORM:** Prisma 7
- **Real-time:** Socket.io (chat, notifications)
- **Auth:** Passport-JWT + Google OAuth2, Argon2 password hashing
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Package Manager:** pnpm 10+
- **Containerization:** Docker Compose (Postgres, PgAdmin, Ollama)

## Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema (Users, Posts, Products, Orders, Offers, etc.)
│   │   ├── seed.ts            # Seed data
│   │   └── migrations/        # Migration files
│   └── src/
│       ├── main.ts            # Entry point
│       ├── app.module.ts      # Root module
│       ├── common/            # Shared modules
│       │   ├── ai/ollama/     # Ollama AI integration (embeddings)
│       │   ├── auth/          # JWT + Google OAuth, guards, decorators
│       │   ├── config/        # Multer config
│       │   ├── database/prisma/ # Prisma service
│       │   ├── notification/  # Notification gateway + service
│       │   ├── search/        # Vector search service (pgvector)
│       │   └── upload/        # File upload controller/service
│       ├── marketplace/       # Marketplace domain
│       │   ├── addresses/     # User addresses
│       │   ├── bank-accounts/ # Bank account management
│       │   ├── banks/         # Bank master data
│       │   ├── categories/    # Hierarchical categories
│       │   ├── offers/        # Offer/negotiation system
│       │   ├── orders/        # Order management
│       │   └── reviews/       # Seller reviews
│       ├── social/            # Social/community domain
│       │   ├── chat/          # 1-on-1 real-time chat (Socket.io)
│       │   ├── comments/      # Post comments
│       │   ├── groups/        # Interest groups within categories
│       │   ├── likes/         # Post likes
│       │   └── posts/         # Community posts (general + selling)
│       ├── users/             # User profiles, follow system
│       ├── admin/             # Admin operations
│       └── reports/           # Report/moderation system
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components (shadcn/ui based)
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities (axios, etc.)
│   └── types/                 # TypeScript type definitions
├── .github/workflows/
│   ├── ci-backend.yml         # Backend CI
│   ├── ci-frontend.yml        # Frontend CI
│   └── cd-production.yml      # Production CD
├── docker-compose.yml         # Dev: Postgres + PgAdmin + Ollama
└── docker-compose.prod.yml    # Production compose
```

## Key Domain Concepts

- **Users** can be both buyers and sellers. They have profiles, addresses, bank accounts, and a reliability score.
- **Categories → Groups:** hierarchical structure (e.g., Sports → Running Shoes). Admins manage categories; users join groups.
- **Posts:** two types — General Post and Selling Post (with stock/price). Support likes, comments, and AI vector search.
- **Offer System:** buyer-seller negotiation with counter-offers (`counterCount`, `lastCounteredBy`). Accepted offers create orders.
- **Order flow:** Offer accepted → Order created → Payment slip uploaded → Seller confirms → Ship → Receive → Complete → Review.
- **Real-time:** Socket.io for 1-on-1 chat and live notifications (offers, order updates, warnings).
- **AI Search:** Ollama (`bge-m3` model) generates embeddings stored via `pgvector`. HNSW indexes on `posts` and `products` tables.

## Development Setup

1. Copy `.env.example` to `.env` and configure.
2. `docker compose up -d postgres pgadmin ollama` — starts DB + PgAdmin + Ollama (AI).
3. Backend: `cd backend && pnpm install && pnpm prisma migrate dev && pnpm run start:dev` (port 3001).
4. Frontend: `cd frontend && pnpm install && pnpm run dev` (port 3000).

## Common Commands

| Command | Description |
|---|---|
| `pnpm run start:dev` | Start backend in watch mode |
| `pnpm prisma migrate dev` | Apply DB migrations |
| `pnpm prisma db seed` | Seed sample data |
| `pnpm prisma generate` | Regenerate Prisma client |
| `pnpm run build` | Build backend |
| `pnpm test` | Run Jest tests |
| `docker compose up -d` | Start infrastructure services |
| `docker compose down` | Stop infrastructure services |

## Backend Conventions

- **Modules:** each domain area has its own NestJS module with controller, service, and `dto/` folder.
- **DTOs:** use `class-validator` + `class-transformer` for validation. DTOs live in `dto/` subdirectories.
- **Auth:** JWT access/refresh tokens stored in HTTP-only cookies. Google OAuth via Passport.
- **Prisma:** raw queries for vector operations (pgvector), standard Prisma client for everything else.
- **File uploads:** Multer config in `common/config/multer.config.ts`.

## Frontend Conventions

- **App Router:** pages in `app/` directory.
- **Forms:** `react-hook-form` + `zod` validation.
- **Styling:** Tailwind CSS v4 with `@theme` and `oklch` color space. shadcn/ui components.
- **API calls:** centralized axios instance in `lib/`.
- **Real-time:** `socket.io-client` for chat and notifications.

## Database Notes

- Uses `pgvector` extension for AI-powered semantic search.
- HNSW indexes needed on `post.embedding` and `product.embedding` (see `START.md` for SQL).
- Ollama runs locally via Docker, providing `bge-m3` embedding model and `llama3.2` LLM.