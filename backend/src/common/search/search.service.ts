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
        let { keyword, categoryId, groupId, minPrice, maxPrice, type, sortBy, minRating } = dto;

        if (!keyword) {
            return null; // Let the caller handle non-search cases
        }

        try {
            // 0. AI Interpretation (Smart Search)
            // Only interpret if query is long enough to potentially contain intent
            if (keyword.length > 5 && !minRating && !type) {
                const interpretation = await this.ollamaService.interpretSearchQuery(keyword);
                if (interpretation) {
                    // Update search params with AI insights
                    if (interpretation.keyword) keyword = interpretation.keyword;
                    if (interpretation.minRating) minRating = interpretation.minRating;

                    // Use AI sort only if user hasn't explicitly set a sort (default is LATEST)
                    if (interpretation.sortBy && sortBy === 'LATEST') {
                        sortBy = interpretation.sortBy;
                    }

                }
            }

            // Generate Embedding จาก Ollama
            const queryEmbedding = await this.ollamaService.generateEmbedding(keyword!);

            // แปลง Array เป็น String Format ที่ pgvector ชอบ: '[0.1,0.2,0.3]'
            const vectorString = `[${queryEmbedding.join(',')}]`;

            // --- เตรียม Conditions (ใช้ Prisma.sql เพื่อความปลอดภัย) ---
            let postFilter = Prisma.sql`p."deletedAt" IS NULL AND p.embedding IS NOT NULL`;
            if (groupId) postFilter = Prisma.sql`${postFilter} AND p."groupId" = ${groupId}`;
            if (categoryId) postFilter = Prisma.sql`${postFilter} AND g."categoryId" = ${categoryId}`;
            if (type && type !== 'ALL') postFilter = Prisma.sql`${postFilter} AND p."type"::text = ${type}`;

            // Base Filters for PRODUCTS
            let productFilter = Prisma.sql`p."deletedAt" IS NULL AND pd.embedding IS NOT NULL`;
            if (groupId) productFilter = Prisma.sql`${productFilter} AND p."groupId" = ${groupId}`;
            if (categoryId) productFilter = Prisma.sql`${productFilter} AND g."categoryId" = ${categoryId}`;
            if (type && type !== 'ALL') productFilter = Prisma.sql`${productFilter} AND p."type"::text = ${type}`;

            if (minPrice !== undefined) {
                // Ignore price filter for NORMAL posts if type is specifically NORMAL
                // But if type is undefined (mix), we might filter out normal posts if we enforce price.
                // Strategy: Apply price filter only to Products table joins or if post type is SELLING.
                // For logic simplicity here: Both queries strictly follow filters.
                // If user asks "cheap" (price filter), they usually want products.
                postFilter = Prisma.sql`${postFilter} AND pd.price >= ${minPrice}`;
                productFilter = Prisma.sql`${productFilter} AND pd.price >= ${minPrice}`;
            }
            if (maxPrice !== undefined) {
                postFilter = Prisma.sql`${postFilter} AND pd.price <= ${maxPrice}`;
                productFilter = Prisma.sql`${productFilter} AND pd.price <= ${maxPrice}`;
            }

            // Rating Filter Logic: 
            // We need to HAVING AVG(r.rating) >= minRating.
            // This requires joining reviews.
            let ratingHaving = Prisma.empty;
            if (minRating) {
                ratingHaving = Prisma.sql`HAVING COALESCE(AVG(r.rating), 0) >= ${minRating}`;
            }

            const exactKeyword = `%${keyword}%`;

            // --- QUERY 1: Search in POSTS ---
            const postResults = await this.prisma.$queryRaw`
                SELECT 
                    p.id, 
                    (1 - (p.embedding <=> ${vectorString}::vector)) +
                    (CASE WHEN p.content ILIKE ${exactKeyword} THEN 0.5 ELSE 0 END) as similarity
                FROM posts p
                LEFT JOIN products pd ON p.id = pd."postId" 
                LEFT JOIN groups g ON p."groupId" = g.id
                LEFT JOIN reviews r ON p."authorId" = r."targetId"
                WHERE ${postFilter}
                GROUP BY p.id
                ${ratingHaving}
                ORDER BY similarity DESC
                LIMIT 30;
            ` as { id: string, similarity: number }[];

            // --- QUERY 2: Search in PRODUCTS ---
            const productResults = await this.prisma.$queryRaw`
                SELECT 
                    p.id as "postId",
                    (1 - (pd.embedding <=> ${vectorString}::vector)) +
                    (CASE WHEN pd.name ILIKE ${exactKeyword} THEN 0.6 ELSE 0 END) +
                    (CASE WHEN pd.description ILIKE ${exactKeyword} THEN 0.3 ELSE 0 END) +
                    (CASE WHEN p.content ILIKE ${exactKeyword} THEN 0.3 ELSE 0 END) as similarity
                FROM products pd
                JOIN posts p ON pd."postId" = p.id
                LEFT JOIN groups g ON p."groupId" = g.id
                LEFT JOIN reviews r ON p."authorId" = r."targetId"
                WHERE ${productFilter}
                GROUP BY p.id, pd.id
                ${ratingHaving}
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
            let mergedResults = Array.from(combinedMap.entries())
                .map(([id, similarity]) => ({ id, similarity }));

            // Apply Sort By (If NOT Relevancy) -- Wait, we sort by similarity first usually.
            // If user wants PRICE ASC, we should sort by Price?
            // Vector Search usually prioritizes Similarity.
            // Hybrid approach:
            // If SortBy is PRICE, we should probably fetch data and sort in memory (since we have mixed results).
            // OR: Order by Similarity first, then sort the top 50 in memory.

            mergedResults = mergedResults.sort((a, b) => b.similarity - a.similarity).slice(0, 50);

            if (mergedResults.length === 0) return [];

            // 4. Fetch Full Data
            const postIds = mergedResults.map(r => r.id);
            const posts = await this.prisma.post.findMany({
                where: { id: { in: postIds } },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            avatarUrl: true,
                            // Ideally we would include avgRating here but Prisma doesn't support relation aggregation in select easily without some tricks or computed fields
                            reviewsReceived: { select: { rating: true } }
                        }
                    },
                    group: { select: { id: true, name: true, category: true } },
                    images: true,
                    products: true,
                    _count: { select: { likes: true, comments: true } }
                }
            });

            // 5. Final Sort & Score Attachment
            const postsWithScore = posts.map(post => {
                const score = mergedResults.find(r => r.id === post.id)?.similarity || 0;

                // Calculate simplistic avg rating for frontend
                const totalRating = post.author.reviewsReceived.reduce((acc, curr) => acc + curr.rating, 0);
                const avgRating = post.author.reviewsReceived.length > 0
                    ? totalRating / post.author.reviewsReceived.length
                    : 0;

                return { ...post, similarity: score, author: { ...post.author, avgRating } };
            });

            // If SortBy is specified, re-sort the final list
            if (sortBy === 'PRICE_ASC') {
                postsWithScore.sort((a, b) => {
                    const priceA = a.products?.[0]?.price ? Number(a.products[0].price) : Infinity;
                    const priceB = b.products?.[0]?.price ? Number(b.products[0].price) : Infinity;
                    return priceA - priceB;
                });
            } else if (sortBy === 'PRICE_DESC') {
                postsWithScore.sort((a, b) => {
                    const priceA = a.products?.[0]?.price ? Number(a.products[0].price) : 0;
                    const priceB = b.products?.[0]?.price ? Number(b.products[0].price) : 0;
                    return priceB - priceA;
                });
            } else {
                // Default: Similarity
                postsWithScore.sort((a, b) => b.similarity - a.similarity);
            }

            return postsWithScore;

        } catch (e) {
            console.error('Vector search failed:', e);
            throw e;
        }
    }
}
