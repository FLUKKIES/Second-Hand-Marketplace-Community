import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

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
                parentId: dto.parentId,
                logoUrl: dto.logoUrl,
                backgroundUrl: dto.backgroundUrl,
            },
        });
    }

    // ดึงหมวดหมู่ทั้งหมด (แบบ Tree Structure แม่ -> ลูก)
    async findAll() {
        return this.prisma.category.findMany({
            where: { parentId: null }, // ดึงเฉพาะตัวแม่มาก่อน
            include: {
                children: { // ดึงลูกๆ ติดมาด้วย
                    include: { children: true } // ดึงหลาน (ถ้ามี)
                }
            },
        });
    }

    // ดึงหมวดหมู่เดียว (ตาม ID)
    async findOne(id: number) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { children: true, parent: true }
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    // อัปเดตหมวดหมู่
    async update(id: number, dto: CreateCategoryDto) {
        // อาจจะต้องทำ logic เช็ค slug ซ้ำอีกทีถ้ามีการเปลี่ยนชื่อ
        // แต่เพื่อความง่าย update แค่ field อื่นๆ ก่อน
        return this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
                // slug: slugify(dto.name, { lower: true }), // ถ้าอยากให้แก้ชื่อแล้ว slug เปลี่ยนด้วยให้เปิดคอมเมนต์นี้
                parentId: dto.parentId,
                logoUrl: dto.logoUrl,
                backgroundUrl: dto.backgroundUrl
            }
        })
    }
}