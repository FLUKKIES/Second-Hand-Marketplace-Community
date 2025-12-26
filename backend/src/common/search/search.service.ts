import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { OllamaService } from '../ai/ollama/ollama.service';
import { SearchPostDto } from './dto/search-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
    constructor(
        private prisma: PrismaService,
        private ollamaService: OllamaService,
    ) { }

    async searchPosts(dto: SearchPostDto) {
        const { keyword, categoryId, groupId, minPrice, maxPrice, type } = dto;

        if (!keyword) {
            return null; // Let the caller handle non-search cases
        }

        try {
            // Generate Embedding จาก Ollama
            const queryEmbedding = await this.ollamaService.generateEmbedding(keyword);

            // แปลง Array เป็น String Format ที่ pgvector ชอบ: '[0.1,0.2,0.3]'
            const vectorString = `[${queryEmbedding.join(',')}]`;

            // --- เตรียม Conditions (ใช้ Prisma.sql เพื่อความปลอดภัย) ---
            let postFilter = Prisma.sql`p."deletedAt" IS NULL AND p.embedding IS NOT NULL`;
            if (groupId) postFilter = Prisma.sql`${postFilter} AND p."groupId" = ${groupId}`;
            if (categoryId) postFilter = Prisma.sql`${postFilter} AND g."categoryId" = ${categoryId}`;
            if (type) postFilter = Prisma.sql`${postFilter} AND p."type"::text = ${type}`;

            // Base Filters for PRODUCTS
            let productFilter = Prisma.sql`p."deletedAt" IS NULL AND pd.embedding IS NOT NULL`;
            if (groupId) productFilter = Prisma.sql`${productFilter} AND p."groupId" = ${groupId}`;
            if (categoryId) productFilter = Prisma.sql`${productFilter} AND g."categoryId" = ${categoryId}`;
            if (type) productFilter = Prisma.sql`${productFilter} AND p."type"::text = ${type}`;

            if (minPrice !== undefined) {
                postFilter = Prisma.sql`${postFilter} AND pd.price >= ${minPrice}`;
                productFilter = Prisma.sql`${productFilter} AND pd.price >= ${minPrice}`;
            }
            if (maxPrice !== undefined) {
                postFilter = Prisma.sql`${postFilter} AND pd.price <= ${maxPrice}`;
                productFilter = Prisma.sql`${productFilter} AND pd.price <= ${maxPrice}`;
            }

            // --- QUERY 1: Search in POSTS ---
            const postResults = await this.prisma.$queryRaw`
                SELECT 
                    p.id, 
                    1 - (p.embedding <=> ${vectorString}::vector) as similarity
                FROM posts p
                LEFT JOIN products pd ON p.id = pd."postId" 
                LEFT JOIN groups g ON p."groupId" = g.id
                WHERE ${postFilter}
                GROUP BY p.id
                ORDER BY similarity DESC
                LIMIT 30;
            ` as { id: string, similarity: number }[];

            // --- QUERY 2: Search in PRODUCTS ---
            const productResults = await this.prisma.$queryRaw`
                SELECT 
                    p.id as "postId",
                    1 - (pd.embedding <=> ${vectorString}::vector) as similarity
                FROM products pd
                JOIN posts p ON pd."postId" = p.id
                LEFT JOIN groups g ON p."groupId" = g.id
                WHERE ${productFilter}
                ORDER BY similarity DESC
                LIMIT 30;
            ` as { postId: string, similarity: number }[];

            // 3. Merge Results
            const combinedMap = new Map<string, number>();

            postResults.forEach(r => {
                combinedMap.set(r.id, r.similarity);
            });

            productResults.forEach(r => {
                const currentScore = combinedMap.get(r.postId) || 0;
                if (r.similarity > currentScore) {
                    combinedMap.set(r.postId, r.similarity);
                }
            });

            // Convert to Array & Sort
            const mergedResults = Array.from(combinedMap.entries())
                .map(([id, similarity]) => ({ id, similarity }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 50);

            if (mergedResults.length === 0) return [];

            // 4. Fetch Full Data
            const postIds = mergedResults.map(r => r.id);
            const posts = await this.prisma.post.findMany({
                where: { id: { in: postIds } },
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                    group: { select: { id: true, name: true, category: true } },
                    images: true,
                    products: true,
                    _count: { select: { likes: true, comments: true } }
                }
            });

            // 5. Final Sort
            const postsWithScore = posts.map(post => {
                const score = mergedResults.find(r => r.id === post.id)?.similarity || 0;
                return { ...post, similarity: score };
            });

            return postsWithScore.sort((a, b) => b.similarity - a.similarity);

        } catch (e) {
            console.error('Vector search failed:', e);
            throw e;
        }
    }
}
