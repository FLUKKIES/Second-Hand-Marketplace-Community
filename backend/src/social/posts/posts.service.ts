import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { SearchPostDto, SortOption } from 'src/common/search/dto/search-post.dto';
import { OllamaService } from 'src/common/ollama/ollama.service';
import * as fs from 'fs';
import path from 'path';
import { SearchService } from 'src/common/search/search.service';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private ollamaService: OllamaService,
        private searchService: SearchService
    ) { }

    // 1. สร้างโพสต์
    async create(userId: string, dto: CreatePostDto) {
        if (dto.type === PostType.SELLING && (!dto.products || dto.products.length === 0)) {
            throw new BadRequestException('Selling post must have at least one product');
        }

        if (!dto.groupId) {
            throw new BadRequestException('Group ID is required');
        }

        // --- 1. Prepare Embeddings BEFORE Transaction (Avoid Timeout) ---
        let postEmbedding: number[] | null = null;
        let productEmbeddings: Map<number, number[]> = new Map(); // Index -> Embedding

        try {
            // A. Post Embedding
            let textToEmbed = dto.content || '';
            if (dto.products) {
                textToEmbed += ' ' + dto.products.map(p => `${p.name} ${p.description || ''}`).join(' ');
            }
            if (textToEmbed.trim()) {
                postEmbedding = await this.ollamaService.generateEmbedding(textToEmbed.trim());
            }

            // B. Product Embeddings
            if (dto.type === PostType.SELLING && dto.products && dto.products.length > 0) {
                const embeddingPromises = dto.products.map(async (p, index) => {
                    const productText = `${p.name} ${p.description || ''}`;
                    const emb = await this.ollamaService.generateEmbedding(productText.trim());
                    return { index, emb };
                });

                // Wait for all embeddings
                const results = await Promise.all(embeddingPromises);
                results.forEach(r => productEmbeddings.set(r.index, r.emb));
            }

        } catch (e) {
            console.error('Failed to generate embeddings (Pre-calculation)', e);
            // We continue without embeddings if generation fails
        }

        // --- 2. Database Transaction ---
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

            // Update Post Embedding if available
            if (postEmbedding) {
                await tx.$executeRaw`UPDATE posts SET embedding = ${JSON.stringify(postEmbedding)}::vector WHERE id = ${post.id}`;
            }

            // Handle Product Creation
            if (dto.type === PostType.SELLING && dto.products && dto.products.length > 0) {
                await Promise.all(dto.products.map(async (p, index) => {
                    // 1. Create Product
                    const createdProduct = await tx.product.create({
                        data: {
                            postId: post.id,
                            name: p.name,
                            price: p.price,
                            description: p.description,
                            stock: p.stock,
                            imageUrl: p.imageUrl, // Save Image URL
                        }
                    });

                    // 2. Update Embedding (using pre-calculated)
                    const emb = productEmbeddings.get(index);
                    if (emb) {
                        await tx.$executeRaw`
                            UPDATE products 
                            SET embedding = ${JSON.stringify(emb)}::vector 
                            WHERE id = ${createdProduct.id}
                        `;
                    }
                }));
            }

            return await tx.post.findUnique({
                where: { id: post.id },
                include: { products: true, images: true }
            })
        }, {
            timeout: 10000 // Increase timeout just in case
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
        const { keyword } = dto;

        // 1. ถ้าไม่มี Keyword ให้ใช้การหาแบบปกติ (Database Filter)
        if (!keyword) {
            return this.findAll(dto);
        }

        // 2. ใช้ SearchService (Vector Search)
        return this.searchService.searchPosts(dto);
    }
}
