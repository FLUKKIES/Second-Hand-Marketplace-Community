import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto, SortOption } from 'src/common/search/dto/search-post.dto';
import { OllamaService } from 'src/common/ai/ollama/ollama.service';
import * as fs from 'fs';
import path from 'path';
import { SearchService } from 'src/common/search/search.service';
import { UploadService } from 'src/common/upload/upload.service';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private ollamaService: OllamaService,
        private searchService: SearchService,
        private uploadService: UploadService
    ) { }

    // 1. สร้างโพสต์
    async create(userId: string, dto: CreatePostDto) {
        if (dto.type === PostType.SELLING && (!dto.products || dto.products.length === 0)) {
            throw new BadRequestException('Selling post must have at least one product');
        }

        if (!dto.groupId) {
            throw new BadRequestException('Group ID is required');
        }

        // Fetch Group and Category context for Embedding
        const groupDetails = await this.prisma.group.findUnique({
            where: { id: dto.groupId },
            include: { category: true }
        });

        const contextStr = groupDetails
            ? `[Group: ${groupDetails.name}, Description: ${groupDetails.description || 'None'}, Category: ${groupDetails.category.name}]`
            : '';

        // --- 1. Prepare Embeddings BEFORE Transaction (Avoid Timeout) ---
        let postEmbedding: number[] | null = null;
        let productEmbeddings: Map<number, number[]> = new Map(); // Index -> Embedding

        try {
            // A. Post Embedding
            let textToEmbed = `${contextStr} ${dto.content || ''}`;
            if (dto.products) {
                textToEmbed += ' ' + dto.products.map(p => `${p.name} ${p.description || ''}`).join(' ');
            }
            if (textToEmbed.trim()) {
                postEmbedding = await this.ollamaService.generateEmbedding(textToEmbed.trim());
            }

            // B. Product Embeddings
            if (dto.type === PostType.SELLING && dto.products && dto.products.length > 0) {
                const embeddingPromises = dto.products.map(async (p, index) => {
                    const productText = `${contextStr} ${p.name} ${p.description || ''}`;
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
                    shippingCost: dto.shippingCost ?? 0,
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
    async findAll(query: any, userId?: string) {
        const where: Prisma.PostWhereInput = {
            deletedAt: null,
            type: query.type,
            groupId: query.groupId ? query.groupId : undefined,
            authorId: query.authorId ? query.authorId : undefined,
        }

        if (query.categoryId) {
            where.group = { categoryId: parseInt(query.categoryId) };
        }

        // --- Personalized Feed Logic ---
        // If logged in AND not viewing a specific group/author/category
        if (userId && !query.groupId && !query.authorId && !query.categoryId) {
            // 1. Get User's Group IDs
            const userGroups = await this.prisma.groupMember.findMany({
                where: { userId },
                select: { groupId: true }
            });

            // 2. Get Followed User IDs
            const following = await this.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true }
            });

            const groupIds = userGroups.map(ug => ug.groupId);
            const followingIds = following.map(f => f.followingId);

            if (groupIds.length === 0 && followingIds.length === 0) {
                // CASE: User follows NO groups AND NO users.
                // Return empty list so frontend can show "Join Groups" or "Follow Users" CTA.
                return [];
            }

            // 3. Filter posts from these groups OR from followed users
            where.OR = [];

            if (groupIds.length > 0) {
                where.OR.push({ groupId: { in: groupIds } });
            }

            if (followingIds.length > 0) {
                where.OR.push({ authorId: { in: followingIds } });
            }
        } else if (!userId && !query.groupId && !query.authorId && !query.categoryId) {
            // CASE: Guest (Global Feed) - No restriction on groupId
            // But if we want to random/recommend, we can leave as is (All posts).
            // Requirement says: "Guest: Random posts from many groups". 
            // Current logic returns ALL posts sorted by createdAt desc, which serves as a global feed.
        }

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 5;
        const skip = (page - 1) * limit;

        return this.prisma.post.findMany({
            where,
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                group: { select: { id: true, name: true, category: true } },
                images: true,
                products: {
                    include: {
                        _count: {
                            select: {
                                offers: {
                                    where: { status: { in: ['PENDING', 'COUNTER_OFFERED'] } }
                                }
                            }
                        }
                    }
                },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip,
        });
    }

    // 3. ดูรายละเอียด (กรอง Soft Delete)
    async findOne(id: string, userId?: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                group: { select: { id: true, name: true, category: true } },
                images: true,
                products: {
                    include: {
                        // If userId is provided, check if I made an offer
                        offers: userId ? {
                            where: { buyerId: userId, status: 'PENDING' } // Check pending offers primarily
                        } : false,
                        _count: {
                            select: {
                                offers: {
                                    where: { status: { in: ['PENDING', 'COUNTER_OFFERED'] } }
                                }
                            }
                        }
                    }
                },
                comments: { include: { user: true } },
                _count: { select: { likes: true } }
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Add isLocked flag to products
        const lockedProducts = await this.prisma.product.findMany({
            where: {
                postId: id,
                OR: [
                    { orderItems: { some: {} } },
                    { offers: { some: {} } }
                ]
            },
            select: { id: true }
        });
        const lockedProductIds = new Set(lockedProducts.map(p => p.id));

        const postWithLockData = {
            ...post,
            products: post.products.map(p => ({
                ...p,
                isLocked: lockedProductIds.has(p.id)
            }))
        };

        // Allow deleted posts to be returned (frontend will handle strict display)
        return postWithLockData;
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

            // Also delete product images
            if (post.products && post.products.length > 0) {
                post.products.forEach(product => {
                    if (product.imageUrl) {
                        filesToDelete.push(product.imageUrl);
                    }
                });
            }

            await this.prisma.post.delete({
                where: { id: postId },
            });

            // Use UploadService to delete files
            filesToDelete.forEach(url => this.uploadService.deleteFile(url));

            return { message: 'Post and related data permanently deleted.' };
        }
    }

    // 5. Update Post
    async update(userId: string, postId: string, dto: any) { // Using any for dto temporarily to avoid strict type issues with PartialType
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { images: true, products: true }
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('Not owner');

        // Logic for updating
        // 1. Content and Meta
        if (dto.content !== undefined || dto.shippingCost !== undefined) {
            await this.prisma.post.update({
                where: { id: postId },
                data: {
                    ...(dto.content !== undefined && { content: dto.content }),
                    ...(dto.shippingCost !== undefined && { shippingCost: dto.shippingCost })
                }
            });
        }

        // 2. Images (If provided, we replace ALL -- Simple strategy for now, or append?)
        // Let's assume frontend sends the FINAL list of images.
        // But uploading happens separately. So `dto.imageUrls` are new images.
        // Actually, for "Edit", if we upload new images, they come as URLs.
        // If we want to KEEP old images, frontend must send them too?
        // Or simpler: `dto.imageUrls` contains NEW images to ADD.
        // And maybe `dto.deleteImageIds` for images to REMOVE.
        // BUT `UpdatePostDto` extends `CreatePostDto` which has `imageUrls`.
        // Let's assume `dto.imageUrls` replaces the current images list?
        // Limitation: If we want to keep some and delete some, efficient way is to send "images to keep" and "images to add".
        // Let's try a simpler approach: "Append New Images" via `imageUrls` validation in `create` used here?
        // If `dto.imageUrls` is present, we ADD them.
        // If user wants to delete, we might need a separate endpoint or field.
        // Let's stick to the plan: "Handle images (replace or append... Simplified: Allow append)".
        // WAIT, the prompt asked to "enable delete image" logic in previous turn (implicitly via "make it delete image correctly").
        // Let's assume if `dto.imageUrls` is passed, it REPLACES all images (so old ones get deleted).
        // This is destructive but cleaner for "sync state".
        // OR: effective state sync.

        // Better Strategy for MVP Edit:
        // - Content: update
        // - Images: If `dto.imageUrls` provided, ADD them.
        // - To DELETE images: We can add `deleteImageUrls` to DTO? Or just handle "Replace All".
        // Let's go with "Replace All" strategy if `dto.imageUrls` is sent.

        if (dto.imageUrls) {
            const oldImages = post.images;
            const newImageUrls = dto.imageUrls as string[];

            // 1. Determine which images were removed (present in DB but not in new list)
            const imagesToDelete = oldImages.filter(
                (img) => !newImageUrls.includes(img.url)
            );

            // 2. Delete ONLY the removed images from Disk
            if (imagesToDelete.length > 0) {
                imagesToDelete.forEach((img) => this.uploadService.deleteFile(img.url));
            }

            // 3. Sync Database
            // Wipe all image relations for this post
            if (oldImages.length > 0) {
                await this.prisma.postImage.deleteMany({ where: { postId: post.id } });
            }

            // Re-create image relations with the new list (preserves order)
            if (newImageUrls.length > 0) {
                await this.prisma.postImage.createMany({
                    data: newImageUrls.map((url) => ({ url, postId: post.id })),
                });
            }
        }

        // 3. Products (Selling Post)
        // If `dto.products` is provided, we probably want to update them.
        // Complex: Products have IDs. If DTO sends products without IDs, are they new?
        // For simplicity: If selling post, and products provided -> Replace All?
        // That seems dangerous for order history.
        // Let's Only update generic fields of existing products if matches?
        // Or for this MVP, let's just allow updating `content` and `images` first.
        // Products update is tricky with Orders.

        // Let's Try "Replace All Products" IF no orders exist.
        // 3. Products Diff and Update
        if (dto.products && post.type === 'SELLING') {
            const lockedProducts = await this.prisma.product.findMany({
                where: {
                    postId,
                    OR: [
                        { orderItems: { some: {} } },
                        { offers: { some: {} } }
                    ]
                }
            });

            const lockedProductIds = new Set(lockedProducts.map(p => p.id));
            const existingProductIds = new Set(post.products.map(p => p.id));

            const incomingProducts = dto.products as any[];
            const incomingProductIds = new Set(incomingProducts.map(p => p.id).filter(id => id));

            // 1. Check Deleted Products (in existing but not in incoming)
            const deletedProductIds = [...existingProductIds].filter(id => !incomingProductIds.has(id));
            for (const id of deletedProductIds) {
                if (lockedProductIds.has(id)) {
                    throw new BadRequestException('Cannot delete product that already has an offer or order');
                }
            }

            // 2. We will silently ignore updates to products in lockedProductIds.

            // 3. Apply changes transactionally
            await this.prisma.$transaction(async (tx) => {
                if (deletedProductIds.length > 0) {
                    await tx.product.deleteMany({
                        where: { id: { in: deletedProductIds } }
                    });
                }

                for (const p of incomingProducts) {
                    if (p.id && existingProductIds.has(p.id)) {
                        if (!lockedProductIds.has(p.id)) {
                            await tx.product.update({
                                where: { id: p.id },
                                data: {
                                    name: p.name,
                                    price: p.price,
                                    stock: p.stock,
                                    description: p.description,
                                    imageUrl: p.imageUrl
                                }
                            });
                        }
                    } else {
                        await tx.product.create({
                            data: {
                                postId,
                                name: p.name,
                                price: p.price,
                                stock: p.stock,
                                description: p.description,
                                imageUrl: p.imageUrl
                            }
                        });
                    }
                }
            });
        }

        // --- Update Embeddings ---
        // Fetch the fresh post to generate accurate embeddings
        const updatedPost = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { group: true, products: true }
        });

        if (updatedPost) {
            const contextStr = `[Group: ${updatedPost.group.name}, Description: ${updatedPost.group.description || 'None'}, Category: ${updatedPost.group.categoryId}]`;

            // 1. Update Post Embedding
            let textToEmbed = `${contextStr} ${updatedPost.content || ''}`;
            if (updatedPost.products && updatedPost.products.length > 0) {
                textToEmbed += ' ' + updatedPost.products.map(p => `${p.name} ${p.description || ''}`).join(' ');
            }
            const postEmbedding = await this.ollamaService.generateEmbedding(textToEmbed.trim());

            if (postEmbedding) {
                const vectorString = `[${postEmbedding.join(',')}]`;
                await this.prisma.$executeRaw`UPDATE posts SET embedding = ${vectorString}::vector WHERE id = ${updatedPost.id}`;
            }

            // 2. Update Product Embeddings
            if (updatedPost.products && updatedPost.products.length > 0) {
                for (const p of updatedPost.products) {
                    const productText = `${contextStr} ${p.name} ${p.description || ''}`;
                    const pdEmbedding = await this.ollamaService.generateEmbedding(productText.trim());
                    if (pdEmbedding) {
                        const pdVectorStr = `[${pdEmbedding.join(',')}]`;
                        await this.prisma.$executeRaw`UPDATE products SET embedding = ${pdVectorStr}::vector WHERE id = ${p.id}`;
                    }
                }
            }
        }

        return this.findOne(postId, userId);
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
