# คำสั่งเริ่มต้นการทำงาน

## สำหรับ Dev 
```bash
docker compose -p myapp-dev -f docker-compose.dev.yml up -d
```

## สำหรับ Prod
```bash
docker compose -p myapp-prod --env-file .env.prod -f docker-compose.prod.yml up -d
```

```
-- 1. สร้าง HNSW Index สำหรับตาราง Posts
-- เราใช้ vector_cosine_ops เพราะในโค้ด search.service.ts
-- เราคำนวณระยะด้วยตัวดำเนินการ <=> (Cosine Distance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS post_embedding_hnsw_idx 
ON posts 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 2. สร้าง HNSW Index สำหรับตาราง Products
CREATE INDEX CONCURRENTLY IF NOT EXISTS product_embedding_hnsw_idx 
ON products 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```