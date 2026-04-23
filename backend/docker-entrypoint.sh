#!/bin/sh
set -e

echo "Starting deployment checks..."

# 1. Run Migrations (structure update)
echo "Running database migrations..."
npx prisma migrate deploy

# 2. Run Seeding (data update)
# Using '|| true' to prevent container crash if seeding fails (e.g. duplicate unique keys)
echo "Running database seeding..."
npx tsx prisma/seed.ts || echo "Seeding failed or skipped (may be intentional)."

# 3. Start Application
echo "Starting NestJS application..."
exec "$@"
