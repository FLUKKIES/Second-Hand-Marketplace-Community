import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import slugify from 'slugify';

import { UploadService } from 'src/common/upload/upload.service';

@Injectable()
export class CategoriesService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService // Inject UploadService
    ) { }

    // สร้างหมวดหมู่ (Admin)
    async create(dto: CreateCategoryDto) {
        // 1. สร้าง Slug อัตโนมัติจากชื่อ
        // lower: true คือแปลงเป็นตัวเล็กทั้งหมด
        const slug = slugify(dto.name, { lower: true });

        // 2. เช็คว่า Slug ซ้ำไหม
        const exists = await this.prisma.category.findUnique({ where: { slug } });
        if (exists) throw new BadRequestException('Category name already exists');

        // 3. บันทึก
        return this.prisma.category.create({
            data: {
                name: dto.name,
                slug: slug,
                imageUrl: dto.logoUrl, // Map DTO logoUrl to schema imageUrl
            },
        });
    }

    // ดึงหมวดหมู่ทั้งหมด (แบบ Tree Structure แม่ -> ลูก)
    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
    }

    // ดึงหมวดหมู่เดียว (ตาม ID)
    async findOne(id: number) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { groups: true }
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async findBySlug(slug: string) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
            include: { groups: true }
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    // อัปเดตหมวดหมู่
    async update(id: number, dto: CreateCategoryDto) {
        // 1. ดึงข้อมูลเดิมมาเช็คก่อน
        const existingCategory = await this.findOne(id);

        // 2. ถ้ามีการเปลี่ยนรูปภาพ ให้ลบรูปเดิมทิ้ง
        if (dto.logoUrl && existingCategory.imageUrl && dto.logoUrl !== existingCategory.imageUrl) {
            await this.uploadService.deleteFile(existingCategory.imageUrl);
        }

        // อาจจะต้องทำ logic เช็ค slug ซ้ำอีกทีถ้ามีการเปลี่ยนชื่อ
        // แต่เพื่อความง่าย update แค่ field อื่นๆ ก่อน
        return this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
                // slug: slugify(dto.name, { lower: true }), // ถ้าอยากให้แก้ชื่อแล้ว slug เปลี่ยนด้วยให้เปิดคอมเมนต์นี้
                imageUrl: dto.logoUrl
            }
        })
    }

    async remove(id: number) {
        // 0. Fetch category to get image URL for deletion
        const category = await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            // 1. Find groups in this category
            // 1. Find groups in this category
            const groups = await tx.group.findMany({ where: { categoryId: id }, select: { id: true } });

            // Prevent deletion if groups exist
            if (groups.length > 0) {
                throw new BadRequestException(`Cannot delete category because it contains ${groups.length} groups. Please remove them first.`);
            }
            // Removed cascading delete logic as requested

            // 4. Delete image file if exists
            if (category.imageUrl) {
                await this.uploadService.deleteFile(category.imageUrl);
            }

            // 5. Delete category
            return tx.category.delete({ where: { id } });
        });
    }
}
