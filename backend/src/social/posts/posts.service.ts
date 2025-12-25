import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { SearchPostDto, SortOption } from './dto/search-post.dto';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    // 1. สร้างโพสต์
    async create(userId: string, dto: CreatePostDto) {
        if (dto.type === PostType.SELLING && (!dto.products || dto.products.length === 0)) {
            throw new BadRequestException('Selling post must have at least one product');
        }

        // ต้องมี groupId ถ้าจะลงกลุ่ม (หรือจะให้ลงหน้า Profile ส่วนตัวได้? Schema บังคับ groupId ไหม?
        // ดู Schema: groupId String (Required). ดังนั้นต้องส่ง groupId มาเสมอ
        if (!dto.groupId) {
             // In case validation failed or manual call
             throw new BadRequestException('Group ID is required');
        }

        return await this.prisma.$transaction(async (tx) => {
            const post = await tx.post.create({
                data: {
                    content: dto.content,
                    type: dto.type as any, // Cast enum if needed
                    authorId: userId,
                    groupId: dto.groupId!,
                    images: dto.imageUrls && dto.imageUrls.length > 0
                        ? { create: dto.imageUrls.map((url) => ({ url })) }
                        : undefined,
                },
            });

            if (dto.type === PostType.SELLING && dto.products && dto.products.length > 0) {
                // Create multiple products
                await tx.product.createMany({
                    data: dto.products.map(p => ({
                        postId: post.id,
                        name: p.name,
                        price: p.price,
                        description: p.description,
                        stock: p.stock,
                    }))
                });
            }

            // Return with relations
            return await tx.post.findUnique({
                where: { id: post.id },
                include: { products: true, images: true }
            })

            return post;
        });
    }

    // 2. ดึง Feed (กรองตัวที่ Soft Delete ออก)
    async findAll(query: any) {
        const where: Prisma.PostWhereInput = {
             deletedAt: null,
             type: query.type,
             groupId: query.groupId ? query.groupId : undefined, // Ensure undefined if not present to avoid type error
        }

        // ถ้ากรอง Category ต้องเช็คผ่าน Group
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
        // 1. ดึงข้อมูลโพสต์ + รูปภาพทั้งหมด + Product
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

        // 2. เช็คว่ามี Order หรือ Offer ที่ Accepted ไหม
        let hasActiveTransaction = false;
        if (post.products && post.products.length > 0) {
            // Check ANY product for orders or accepted offers
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
            // === Case A: Soft Delete (มีคนซื้อแล้ว) ===
            await this.prisma.post.update({
                where: { id: postId },
                data: { deletedAt: new Date() },
            });
            return { message: 'Post archived (Soft Deleted) because it has related transactions.' };

        } else {
            // === Case B: Hard Delete (ยังไม่มีคนซื้อ) ===
            const filesToDelete: string[] = [];

            // เก็บ URL จาก PostImage
            if (post.images && post.images.length > 0) {
                post.images.forEach(img => filesToDelete.push(img.url));
            }
            // Product ไม่มีรูปแยก ใช้รูปจาก PostImage (ถ้ามี logic แยกก็เพิ่มตรงนี้ได้)

            // ลบ DB
            await this.prisma.post.delete({
                where: { id: postId },
            });

            // ลบไฟล์
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
    // ฟังก์ชันค้นหาขั้นสูง (Advanced Search)
    // =========================================================
    async search(dto: SearchPostDto) {
        const { keyword, categoryId, groupId, minPrice, maxPrice, sortBy } = dto;

        // 1. สร้างเงื่อนไข Where
        const where: Prisma.PostWhereInput = {
            deletedAt: null,
            // กรอง Group/Category
            groupId: groupId ? groupId : undefined,
            group: categoryId ? { categoryId: categoryId } : undefined,

            AND: []
        };
        // ใส่ AND แยกเพื่อให้ Type Check ง่ายขึ้น
        const andConditions: Prisma.PostWhereInput[] = [];

        // Keyword Search
        if (keyword) {
            andConditions.push({
                OR: [
                    { content: { contains: keyword, mode: 'insensitive' } },
                    { products: { some: { name: { contains: keyword, mode: 'insensitive' } } } }
                ]
            });
        }

        // Price Range Search (Only for Selling posts with Product)
        if (minPrice !== undefined || maxPrice !== undefined) {
             andConditions.push({
                 products: {
                     some: {
                         price: {
                             gte: minPrice || 0,
                             lte: maxPrice || 99999999
                         }
                     }
                 }
             });
        }
        
        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        // 2. Sort
        let orderBy: Prisma.PostOrderByWithRelationInput = { createdAt: 'desc' };

        switch (sortBy) {
            case SortOption.OLDEST:
                orderBy = { createdAt: 'asc' };
                break;
            case SortOption.POPULAR:
                orderBy = { likes: { _count: 'desc' } };
                break;
            // case SortOption.PRICE_ASC:
            //     // 1-to-many: cannot sort parent by child field directly in this version
            //     break;
            // case SortOption.PRICE_DESC:
            //     break;
        }

        // 3. Query
        return this.prisma.post.findMany({
            where,
            orderBy,
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                group: { select: { id: true, name: true, category: true } },
                images: true,
                products: true,
                _count: { select: { likes: true, comments: true } }
            },
        });
    }
}
