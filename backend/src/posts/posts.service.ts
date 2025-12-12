import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { SearchPostDto, SortOption } from './dto/search-post.dto';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    // 1. สร้างโพสต์
    async create(userId: string, dto: CreatePostDto) {
        if (dto.type === 'SALE' && (!dto.saleItems || dto.saleItems.length === 0)) {
            throw new BadRequestException('Sale post must have at least one item');
        }

        return await this.prisma.$transaction(async (tx) => {
            const post = await tx.post.create({
                data: {
                    content: dto.content,
                    type: dto.type,
                    authorId: userId,
                    categoryId: dto.categoryId,
                    images: dto.imageUrls && dto.imageUrls.length > 0
                        ? { create: dto.imageUrls.map((url) => ({ url })) }
                        : undefined,
                },
            });

            if (dto.type === 'SALE' && dto.saleItems) {
                await tx.saleItem.createMany({
                    data: dto.saleItems.map((item) => ({
                        postId: post.id,
                        name: item.name,
                        price: item.price,
                        description: item.description,
                        imageUrl: item.imageUrl,
                        stock: item.stock,
                    })),
                });
            }

            return post;
        });
    }

    // 2. ดึง Feed (กรองตัวที่ Soft Delete ออก)
    async findAll(query: any) {
        return this.prisma.post.findMany({
            where: {
                type: query.type,
                categoryId: query.categoryId ? parseInt(query.categoryId) : undefined,
                deletedAt: null, // *** สำคัญ: เอาเฉพาะที่ยังไม่ลบ
            },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                category: true,
                images: true,
                saleItems: true,
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
                category: true,
                images: true,
                saleItems: true,
                comments: { include: { user: true } },
                _count: { select: { likes: true } }
            },
        });

        if (!post || post.deletedAt) { // *** เช็ค deletedAt
            throw new NotFoundException('Post not found or has been deleted');
        }
        return post;
    }

    // 4. ลบโพสต์ (Soft Delete Logic)
    // =========================================================
    // อัปเดตฟังก์ชัน Remove ให้ลบไฟล์ด้วย
    // =========================================================
    async remove(userId: string, postId: string) {
        // 1. ดึงข้อมูลโพสต์ + รูปภาพทั้งหมด (images และ saleItems.imageUrl)
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                images: true,    // รูปปก/รูป General
                saleItems: {     // รูปสินค้า
                    include: { orderItems: true }
                }
            },
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('Not owner');

        // 2. เช็คว่ามี Order ไหม (Logic เดิม)
        const hasOrders = post.saleItems.some((item) => item.orderItems.length > 0);

        if (hasOrders) {
            // === Case A: Soft Delete (มีคนซื้อแล้ว) ===
            // *ไม่ต้องลบรูป* เพราะต้องเก็บไว้โชว์ในประวัติการซื้อ
            await this.prisma.post.update({
                where: { id: postId },
                data: { deletedAt: new Date() },
            });
            return { message: 'Post archived (Soft Deleted) because it has orders.' };

        } else {
            // === Case B: Hard Delete (ยังไม่มีคนซื้อ) ===

            // [STEP 1] รวบรวมรายชื่อไฟล์รูปภาพที่จะลบ
            const filesToDelete: string[] = [];

            // เก็บ URL จาก PostImage (General / Cover)
            if (post.images && post.images.length > 0) {
                post.images.forEach(img => filesToDelete.push(img.url));
            }

            // เก็บ URL จาก SaleItem (สินค้า)
            if (post.saleItems && post.saleItems.length > 0) {
                post.saleItems.forEach(item => filesToDelete.push(item.imageUrl));
            }

            // [STEP 2] ลบข้อมูลใน Database ก่อน (Prisma Cascade จะลบ row ใน table รูปให้อัตโนมัติ)
            await this.prisma.post.delete({
                where: { id: postId },
            });

            // [STEP 3] ลบไฟล์จริงออกจากเครื่อง (Disk)
            this.deleteFilesFromDisk(filesToDelete);

            return { message: 'Post and related images permanently deleted.' };
        }
    }

    // =========================================================
    // Helper: ฟังก์ชันช่วยลบไฟล์
    // =========================================================
    private deleteFilesFromDisk(fileUrls: string[]) {
        fileUrls.forEach((url) => {
            try {
                // url จะเป็นรูปแบบ "/uploads/posts/xxx.jpg"
                // เราต้องแปลงให้เป็น Path จริงในเครื่อง เช่น "C:/project/uploads/posts/xxx.jpg"

                // process.cwd() คือ root folder ของโปรเจกต์
                const filePath = path.join(process.cwd() + '/public', url);

                // ตรวจสอบว่ามีไฟล์อยู่จริงไหม แล้วค่อยลบ
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // คำสั่งลบไฟล์
                    console.log(`Deleted file: ${filePath}`);
                }
            } catch (error) {
                // ถ้าลบไม่ได้ (เช่น ไฟล์ไม่มีอยู่จริง หรือติด permission) ก็ให้ข้ามไป ไม่ต้อง throw error ให้ User เห็น
                console.error(`Failed to delete file: ${url}`, error);
            }
        });
    }

    // =========================================================
    // ฟังก์ชันค้นหาขั้นสูง (Advanced Search)
    // =========================================================
    async search(dto: SearchPostDto) {
        const { keyword, categoryId, minPrice, maxPrice, sortBy } = dto;

        // 1. สร้างเงื่อนไข Where (Filter)
        const where: Prisma.PostWhereInput = {
            deletedAt: null, // ต้องไม่ถูกลบ
            type: 'SALE',    // (Optional) ปกติคนค้นหาของซื้อของขาย

            // A. กรอง Category
            categoryId: categoryId ? categoryId : undefined,

            // B. กรอง Keyword (ค้นหาใน Content หรือ ชื่อสินค้า)
            AND: [
                keyword ? {
                    OR: [
                        { content: { contains: keyword, mode: 'insensitive' } }, // ค้นในโพสต์ (Case insensitive)
                        {
                            saleItems: {
                                some: { name: { contains: keyword, mode: 'insensitive' } } // ค้นในชื่อสินค้า
                            }
                        }
                    ]
                } : {},

                // C. กรองช่วงราคา (Price Range)
                // หาโพสต์ที่มีสินค้า "อย่างน้อย 1 ชิ้น" อยู่ในช่วงราคานี้
                (minPrice || maxPrice) ? {
                    saleItems: {
                        some: {
                            price: {
                                gte: minPrice || 0,           // มากกว่าหรือเท่ากับ
                                lte: maxPrice || 99999999,    // น้อยกว่าหรือเท่ากับ
                            }
                        }
                    }
                } : {}
            ]
        };

        // 2. สร้างเงื่อนไข OrderBy (Sorting)
        let orderBy: Prisma.PostOrderByWithRelationInput = { createdAt: 'desc' }; // Default

        if (sortBy === SortOption.OLDEST) {
            orderBy = { createdAt: 'asc' };
        } else if (sortBy === SortOption.POPULAR) {
            orderBy = { likes: { _count: 'desc' } }; // เรียงตามจำนวนไลก์
        }

        // 3. Query Database
        return this.prisma.post.findMany({
            where,
            orderBy,
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                category: true,
                images: true,
                saleItems: true, // ดึงสินค้ามาโชว์ด้วย
                _count: { select: { likes: true, comments: true } }
            },
        });
    }
}