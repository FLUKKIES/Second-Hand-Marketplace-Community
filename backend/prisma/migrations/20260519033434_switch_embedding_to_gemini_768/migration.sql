-- Switch embedding columns from vector(1024) (bge-m3) to vector(768) (Gemini text-embedding-004)
-- Existing embeddings are cleared since dimensions are incompatible

ALTER TABLE "posts" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "posts" ADD COLUMN "embedding" vector(768);

ALTER TABLE "products" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "products" ADD COLUMN "embedding" vector(768);
