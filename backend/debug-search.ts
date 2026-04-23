
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const posts = await prisma.post.findMany({
        take: 20,
        select: {
            id: true,
            content: true,
            type: true,
        }
    });

    console.log('--- Posts in DB (First 5) ---');
    console.dir(posts.slice(0, 5), { depth: null });

    // Check if embeddings exist (raw query needed)
    const embeddingCheck = await prisma.$queryRaw`
    SELECT id, substring(content, 1, 20) as content_preview, (embedding IS NOT NULL) as has_embedding FROM posts LIMIT 20;
  `;
    console.log('--- Embedding Status ---');
    console.table(embeddingCheck);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
