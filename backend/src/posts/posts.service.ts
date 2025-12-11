import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    //1. สร้างโพสต์
    async create(userId: string, dto: CreatePostDto) {
        // Validation: Sale Post ต้องมีของขายอย่างน้อย 1 ชิ้น
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

                    // --- จุดที่แก้ไข (Remove Condition) ---
                    // เดิม: dto.type === 'GENERAL' && dto.imageUrls ? ...
                    // ใหม่: แค่เช็คว่ามีรูปส่งมาไหม ถ้ามีก็บันทึกเป็น PostImage (ภาพปก)
                    images: dto.imageUrls && dto.imageUrls.length > 0
                        ? {
                            create: dto.imageUrls.map((url) => ({ url })),
                        }
                        : undefined,
                },
            });

            // ถ้าเป็น Sale Post ก็บันทึกรายการสินค้าย่อย (SaleItem) ตามปกติ
            if (dto.type === 'SALE' && dto.saleItems) {
                await tx.saleItem.createMany({
                    data: dto.saleItems.map((item) => ({
                        postId: post.id,
                        name: item.name,
                        price: item.price,
                        description: item.description,
                        imageUrl: item.imageUrl, // รูปเฉพาะของสินค้านั้นๆ (เช่น รูปสีแดง, รูปสีน้ำเงิน)
                        stock: item.stock,
                    })),
                });
            }

            return post; // หรือจะ query return แบบ full structure ก็ได้
        });
    }

    // ฟังก์ชันดึง Feed
    async findAll() {
        return this.prisma.post.findMany({
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                images: true,    // รูปของ General Post
                saleItems: true, // สินค้าของ Sale Post
                category: true,
                _count: { select: { likes: true, comments: true } } // นับจำนวนไลก์/คอมเมนต์
            },
            orderBy: { createdAt: 'desc' }, // ใหม่สุดขึ้นก่อน
        });
    }

    async toggleLike(userId: string, postId: string) {
        // 1. เช็คก่อนว่าโพสต์มีอยู่จริงไหม
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        // 2. เช็คว่า User คนนี้เคย Like หรือยัง
        const existingLike = await this.prisma.like.findUnique({
            where: {
                userId_postId: { // Composite Key ที่เราทำไว้ใน Schema
                    userId,
                    postId,
                },
            },
        });

        if (existingLike) {
            // 3A. ถ้ามีแล้ว -> ลบออก (Unlike)
            await this.prisma.like.delete({
                where: {
                    userId_postId: { userId, postId },
                },
            });
            return { message: 'Unliked', isLiked: false };
        } else {
            // 3B. ถ้ายังไม่มี -> สร้างใหม่ (Like)
            await this.prisma.like.create({
                data: {
                    userId,
                    postId,
                },
            });
            return { message: 'Liked', isLiked: true };
        }
    }
}