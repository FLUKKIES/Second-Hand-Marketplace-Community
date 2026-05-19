-- Switch embedding columns to vector(3072) for gemini-embedding-001

ALTER TABLE "posts" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "posts" ADD COLUMN "embedding" vector(3072);

ALTER TABLE "products" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "products" ADD COLUMN "embedding" vector(3072);