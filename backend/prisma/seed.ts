import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
    const admin = await prisma.user.upsert({
        where: { email: "admin@admin.com" },
        update: {},
        create: {
            email: "admin@admin.com",
            username: "admin",
            role: "ADMIN",
        },
    });
    console.log(admin);

    const user = await prisma.user.upsert({
        where: { email: "user@user.com" },
        update: {},
        create: {
            email: "user@user.com",
            username: "user",
            role: "USER",
        },
    });
    console.log(user);

    // 1. สร้างหมวดหมู่หลัก
    const electronics = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: {
            name: 'Electronics',
            slug: 'electronics',
        },
    });

    // 2. สร้างหมวดหมู่ย่อย (เช่น มือถือ)
    await prisma.category.create({
        data: {
            name: 'Mobile Phones',
            slug: slugify('Mobile Phones', { lower: true }),
            parentId: electronics.id, // ผูกกับแม่
        },
    });

    // สร้างหมวดอื่นๆ เพิ่มตามต้องการ...
    console.log('Seeding categories done!');
}

main()
    .catch()
    .finally(async () => {
        await prisma.$disconnect();
    });