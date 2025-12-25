import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { SearchPostDto, SortOption } from './dto/search-post.dto';
import { OllamaService } from 'src/common/ollama/ollama.service';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private ollamaService: OllamaService
    ) { }

        // 1. สร้างโพสต์
        async create(userId: string, dto: CreatePostDto) {
        if (dto.type === PostType.SELLING && (!dto.products || dto.products.length === 0)) {
            throw new BadRequestException('Selling post must have at least one product');
        }

        if (!dto.groupId) {
            throw new BadRequestException('Group ID is required');
        }

        return await this.prisma.$transaction(async (tx) => {
            const post = await tx.post.create({
                data: {
                    content: dto.content,
                    type: dto.type as any,
                    authorId: userId,
                    groupId: dto.groupId!,
                    images: dto.imageUrls && dto.imageUrls.length > 0
                        ? { create: dto.imageUrls.map((url) => ({ url })) }
                        : undefined,
                },
            });

            // Handle Product Creation with Embeddings
            if (dto.type === PostType.SELLING && dto.products && dto.products.length > 0) {
                // We create products one by one (or parallel) to get their IDs for embedding updates
                await Promise.all(dto.products.map(async (p) => {
                    // 1. Create Product
                    const createdProduct = await tx.product.create({
                        data: {
                            postId: post.id,
                            name: p.name,
                            price: p.price,
                            description: p.description,
                            stock: p.stock,
                        }
                    });

                    // 2. Generate Product Embedding
                    try {
                        const productText = `${p.name} ${p.description || ''}`;
                        const embedding = await this.ollamaService.generateEmbedding(productText.trim());

                        // 3. Update Product Embedding
                        await tx.$executeRaw`
                            UPDATE products 
                            SET embedding = ${JSON.stringify(embedding)}::vector 
                            WHERE id = ${createdProduct.id}
                        `;
                    } catch (e) {
                        console.error(`Failed to generate embedding for product ${createdProduct.id}`, e);
                        // Continue even if embedding fails
                    }
                }));
            }

            // *** Generate Post Embedding ***
            try {
                let textToEmbed = dto.content || '';
                // Include product names in post embedding too for overall context
                if (dto.products) {
                    textToEmbed += ' ' + dto.products.map(p => `${p.name} ${p.description || ''}`).join(' ');
                }

                if (textToEmbed.trim()) {
                    const embedding = await this.ollamaService.generateEmbedding(textToEmbed.trim());
                    // Update vector column
                    await tx.$executeRaw`UPDATE posts SET embedding = ${JSON.stringify(embedding)}::vector WHERE id = ${post.id}`;
                }
            } catch (e) {
                console.error('Failed to generate embedding for post', e);
            }

            return await tx.post.findUnique({
                where: { id: post.id },
                include: { products: true, images: true }
            })
        });
    }

    // 2. ดึง Feed (กรองตัวที่ Soft Delete ออก)
    async findAll(query: any) {
        // ... (Original findAll logic if needed, but 'search' function covers search)
        // Leaving this as is for simple feed
        const where: Prisma.PostWhereInput = {
            deletedAt: null,
            type: query.type,
            groupId: query.groupId ? query.groupId : undefined,
        }

        if (query.categoryId) {
            where.group = { categoryId: parseInt(query.categoryId) };
        }

        return this.prisma.post.findMany({
            where,
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                group: { select: { id: true, name: true, category: true } },
                images: true,
                products: true,
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // 3. ดูรายละเอียด (กรอง Soft Delete)
    async findOne(id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                group: { select: { id: true, name: true, category: true } },
                images: true,
                products: true,
                comments: { include: { user: true } },
                _count: { select: { likes: true } }
            },
        });

        if (!post || post.deletedAt) {
            throw new NotFoundException('Post not found or has been deleted');
        }
        return post;
    }

    // 4. ลบโพสต์ (Soft Delete Logic)
    async remove(userId: string, postId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                images: true,
                products: {
                    include: { orderItems: true, offers: true }
                }
            },
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('Not owner');

        let hasActiveTransaction = false;
        if (post.products && post.products.length > 0) {
            for (const product of post.products) {
                if (product.orderItems.length > 0) {
                    hasActiveTransaction = true;
                    break;
                }
                const acceptedOffers = product.offers.some(o => o.status === 'ACCEPTED');
                if (acceptedOffers) {
                    hasActiveTransaction = true;
                    break;
                }
            }
        }

        if (hasActiveTransaction) {
            await this.prisma.post.update({
                where: { id: postId },
                data: { deletedAt: new Date() },
            });
            return { message: 'Post archived (Soft Deleted) because it has related transactions.' };

        } else {
            const filesToDelete: string[] = [];

            if (post.images && post.images.length > 0) {
                post.images.forEach(img => filesToDelete.push(img.url));
            }

            await this.prisma.post.delete({
                where: { id: postId },
            });

            this.deleteFilesFromDisk(filesToDelete);

            return { message: 'Post and related data permanently deleted.' };
        }
    }

    private deleteFilesFromDisk(fileUrls: string[]) {
        fileUrls.forEach((url) => {
            try {
                const filePath = path.join(process.cwd() + '/public', url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error(`Failed to delete file: ${url}`, error);
            }
        });
    }

    // =========================================================
    // ฟังก์ชันค้นหาขั้นสูง (Advanced Search) - Updated V.3 (With Deep Product Search)
    // =========================================================
    async search(dto: SearchPostDto) {
        const { keyword, categoryId, groupId, minPrice, maxPrice, sortBy } = dto;

        // 1. ถ้าไม่มี Keyword ให้ใช้การหาแบบปกติ (Database Filter)
        if (!keyword) {
            return this.findAll(dto);
        }

        // 2. *** Vector Search Logic ***
        try {
            // Generate Embedding จาก Ollama
            const queryEmbedding = await this.ollamaService.generateEmbedding(keyword);

            // แปลง Array เป็น String Format ที่ pgvector ชอบ: '[0.1,0.2,0.3]'
            const vectorString = `[${queryEmbedding.join(',')}]`;

            // --- เตรียม Conditions (ใช้ Prisma.sql เพื่อความปลอดภัย) ---

            /* 
               เนื่องจากเราต้อง Query 2 ตาราง (posts, products) และเอามารวมกัน
               เราจะใช้ UNION หรือ 2 Queries ก็ได้
               แต่เพื่อความง่ายและจัดการ Similarity Score เราจะแยก 2 Queries แล้วรวมใน Code
            */

            // Common Filters
            // Note: Prisma.sql works best when composing parts.
            // We can't reuse variables exactly strictly in Raw string without care, but simple valid SQL values are fine.

            // Base Filters for POSTS
            let postFilter = Prisma.sql`p."deletedAt" IS NULL AND p.embedding IS NOT NULL`;
            if (groupId) postFilter = Prisma.sql`${postFilter} AND p."groupId" = ${groupId}`;
            if (categoryId) postFilter = Prisma.sql`${postFilter} AND g."categoryId" = ${categoryId}`;

            // Base Filters for PRODUCTS
            let productFilter = Prisma.sql`p."deletedAt" IS NULL AND pd.embedding IS NOT NULL`;
            if (groupId) productFilter = Prisma.sql`${productFilter} AND p."groupId" = ${groupId}`;
            if (categoryId) productFilter = Prisma.sql`${productFilter} AND g."categoryId" = ${categoryId}`;
            // Price filter applies to product search naturally, and to post search via JOIN
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
            // เราต้องการ Post ID กลับมา
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

            // Add Post Results
            postResults.forEach(r => {
                combinedMap.set(r.id, r.similarity);
            });

            // Add Product Results (take MAX score if exists)
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
                .slice(0, 50); // Final Limit

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

            // 5. Final Sort (Ensure order matches similarity)
            const postsWithScore = posts.map(post => {
                const score = mergedResults.find(r => r.id === post.id)?.similarity || 0;
                return { ...post, similarity: score };
            });

            return postsWithScore.sort((a, b) => b.similarity - a.similarity);

        } catch (e) {
            console.error('Vector search failed:', e);
            return this.findAll(dto);
        }
    }
}
