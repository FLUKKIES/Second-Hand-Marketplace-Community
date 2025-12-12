import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
    OrderRequestStatus,
    OrderStatus,
    PostType,
    Prisma,
    PrismaClient,
    Role,
} from '@prisma/client'
import slugify from 'slugify'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Start seeding...')

    const [admin, alice, bob] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@admin.com' },
            update: {},
            create: {
                email: 'admin@admin.com',
                username: 'admin',
                role: Role.ADMIN,
            },
        }),
        prisma.user.upsert({
            where: { email: 'alice@smarket.com' },
            update: {
                username: 'alice',
                bio: 'Seller focusing on second-hand gadgets',
                phoneNumber: '080-000-0001',
            },
            create: {
                email: 'alice@smarket.com',
                username: 'alice',
                role: Role.USER,
                bio: 'Seller focusing on second-hand gadgets',
                phoneNumber: '080-000-0001',
            },
        }),
        prisma.user.upsert({
            where: { email: 'bob@smarket.com' },
            update: {
                username: 'bob',
                bio: 'Casual buyer, loves bargains',
                phoneNumber: '081-000-0002',
            },
            create: {
                email: 'bob@smarket.com',
                username: 'bob',
                role: Role.USER,
                bio: 'Casual buyer, loves bargains',
                phoneNumber: '081-000-0002',
            },
        }),
    ])

    console.log('✅ Users ready')

    const electronics = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: { name: 'Electronics' },
        create: {
            name: 'Electronics',
            slug: 'electronics',
            logoUrl: 'https://placehold.co/120x120?text=Electronics',
        },
    })

    const mobilePhones = await prisma.category.upsert({
        where: { slug: 'mobile-phones' },
        update: {
            name: 'Mobile Phones',
            parentId: electronics.id,
        },
        create: {
            name: 'Mobile Phones',
            slug: slugify('Mobile Phones', { lower: true }),
            parentId: electronics.id,
            logoUrl: 'https://placehold.co/120x120?text=Phones',
        },
    })

    const laptops = await prisma.category.upsert({
        where: { slug: 'laptops' },
        update: {
            name: 'Laptops',
            parentId: electronics.id,
        },
        create: {
            name: 'Laptops',
            slug: slugify('Laptops', { lower: true }),
            parentId: electronics.id,
            logoUrl: 'https://placehold.co/120x120?text=Laptops',
        },
    })

    const fashion = await prisma.category.upsert({
        where: { slug: 'fashion' },
        update: { name: 'Fashion' },
        create: {
            name: 'Fashion',
            slug: 'fashion',
            logoUrl: 'https://placehold.co/120x120?text=Fashion',
        },
    })

    const sneakers = await prisma.category.upsert({
        where: { slug: 'sneakers' },
        update: {
            name: 'Sneakers',
            parentId: fashion.id,
        },
        create: {
            name: 'Sneakers',
            slug: slugify('Sneakers', { lower: true }),
            parentId: fashion.id,
            logoUrl: 'https://placehold.co/120x120?text=Sneakers',
        },
    })

    console.log('✅ Categories ready')

    const iphonePost = await prisma.post.upsert({
        where: { id: 'post-iphone-14-pro' },
        update: {
            content:
                'ขาย iPhone 14 Pro 128GB สี Space Black สภาพสวย แบต 92% ครบกล่อง',
            type: PostType.SALE,
            authorId: alice.id,
            categoryId: mobilePhones.id,
        },
        create: {
            id: 'post-iphone-14-pro',
            content:
                'ขาย iPhone 14 Pro 128GB สี Space Black สภาพสวย แบต 92% ครบกล่อง',
            type: PostType.SALE,
            authorId: alice.id,
            categoryId: mobilePhones.id,
        },
    })

    const macbookPost = await prisma.post.upsert({
        where: { id: 'post-macbook-air' },
        update: {
            content:
                'MacBook Air M1 16GB/512GB ใช้งานถนอม ประกันร้านเหลือ 5 เดือน',
            type: PostType.SALE,
            authorId: alice.id,
            categoryId: laptops.id,
        },
        create: {
            id: 'post-macbook-air',
            content:
                'MacBook Air M1 16GB/512GB ใช้งานถนอม ประกันร้านเหลือ 5 เดือน',
            type: PostType.SALE,
            authorId: alice.id,
            categoryId: laptops.id,
        },
    })

    const helloPost = await prisma.post.upsert({
        where: { id: 'post-community-hello' },
        update: {
            content: 'สวัสดีทุกคนใน community มีใครแนะนำร้านรับฝากขายไหมครับ?',
            type: PostType.GENERAL,
            authorId: bob.id,
            categoryId: electronics.id,
        },
        create: {
            id: 'post-community-hello',
            content:
                'สวัสดีทุกคนใน community มีใครแนะนำร้านรับฝากขายไหมครับ?',
            type: PostType.GENERAL,
            authorId: bob.id,
            categoryId: electronics.id,
        },
    })

    await Promise.all([
        prisma.postImage.upsert({
            where: { id: 'img-iphone-front' },
            update: {
                url: 'https://placehold.co/800x800?text=iPhone+Front',
                postId: iphonePost.id,
            },
            create: {
                id: 'img-iphone-front',
                url: 'https://placehold.co/800x800?text=iPhone+Front',
                postId: iphonePost.id,
            },
        }),
        prisma.postImage.upsert({
            where: { id: 'img-iphone-back' },
            update: {
                url: 'https://placehold.co/800x800?text=iPhone+Back',
                postId: iphonePost.id,
            },
            create: {
                id: 'img-iphone-back',
                url: 'https://placehold.co/800x800?text=iPhone+Back',
                postId: iphonePost.id,
            },
        }),
        prisma.postImage.upsert({
            where: { id: 'img-macbook' },
            update: {
                url: 'https://placehold.co/900x600?text=MacBook+Air',
                postId: macbookPost.id,
            },
            create: {
                id: 'img-macbook',
                url: 'https://placehold.co/900x600?text=MacBook+Air',
                postId: macbookPost.id,
            },
        }),
    ])

    const iphoneItem = await prisma.saleItem.upsert({
        where: { id: 'sale-item-iphone-14-pro' },
        update: {
            name: 'iPhone 14 Pro 128GB',
            price: new Prisma.Decimal('28900.00'),
            description: 'เครื่องไทย ประกันศูนย์ เหลืออุปกรณ์ครบชุด',
            imageUrl: 'https://placehold.co/800x800?text=iPhone+14+Pro',
            stock: 1,
            isSoldOut: true,
            postId: iphonePost.id,
        },
        create: {
            id: 'sale-item-iphone-14-pro',
            name: 'iPhone 14 Pro 128GB',
            price: new Prisma.Decimal('28900.00'),
            description: 'เครื่องไทย ประกันศูนย์ เหลืออุปกรณ์ครบชุด',
            imageUrl: 'https://placehold.co/800x800?text=iPhone+14+Pro',
            stock: 1,
            isSoldOut: true,
            postId: iphonePost.id,
        },
    })

    const macbookItem = await prisma.saleItem.upsert({
        where: { id: 'sale-item-macbook-air' },
        update: {
            name: 'MacBook Air M1 16/512',
            price: new Prisma.Decimal('39900.00'),
            description: 'ใส่เคสตลอด ไม่มีรอยบิ่น แถมซอฟต์แวร์ Office',
            imageUrl: 'https://placehold.co/900x600?text=MacBook+Air',
            stock: 2,
            isSoldOut: false,
            postId: macbookPost.id,
        },
        create: {
            id: 'sale-item-macbook-air',
            name: 'MacBook Air M1 16/512',
            price: new Prisma.Decimal('39900.00'),
            description: 'ใส่เคสตลอด ไม่มีรอยบิ่น แถมซอฟต์แวร์ Office',
            imageUrl: 'https://placehold.co/900x600?text=MacBook+Air',
            stock: 2,
            isSoldOut: false,
            postId: macbookPost.id,
        },
    })

    await Promise.all([
        prisma.comment.upsert({
            where: { id: 'comment-iphone-question' },
            update: {
                content: 'ยังอยู่ไหมครับ มีประกันศูนย์เหลือกี่เดือน',
                userId: bob.id,
                postId: iphonePost.id,
            },
            create: {
                id: 'comment-iphone-question',
                content: 'ยังอยู่ไหมครับ มีประกันศูนย์เหลือกี่เดือน',
                userId: bob.id,
                postId: iphonePost.id,
            },
        }),
        prisma.comment.upsert({
            where: { id: 'comment-community-answer' },
            update: {
                content: 'แนะนำลองใช้ระบบ Escrow ในแพลตฟอร์มนี้เลยครับ ปลอดภัยกว่า',
                userId: alice.id,
                postId: helloPost.id,
            },
            create: {
                id: 'comment-community-answer',
                content: 'แนะนำลองใช้ระบบ Escrow ในแพลตฟอร์มนี้เลยครับ ปลอดภัยกว่า',
                userId: alice.id,
                postId: helloPost.id,
            },
        }),
    ])

    await Promise.all([
        prisma.like.upsert({
            where: { userId_postId: { userId: bob.id, postId: iphonePost.id } },
            update: {},
            create: { userId: bob.id, postId: iphonePost.id },
        }),
        prisma.like.upsert({
            where: { userId_postId: { userId: alice.id, postId: helloPost.id } },
            update: {},
            create: { userId: alice.id, postId: helloPost.id },
        }),
    ])

    const iphoneRequest = await prisma.orderRequest.upsert({
        where: { id: 'order-req-iphone-bob' },
        update: {
            buyerId: bob.id,
            saleItemId: iphoneItem.id,
            status: OrderRequestStatus.APPROVED,
        },
        create: {
            id: 'order-req-iphone-bob',
            buyerId: bob.id,
            saleItemId: iphoneItem.id,
            status: OrderRequestStatus.APPROVED,
        },
    })

    await prisma.orderRequest.upsert({
        where: { id: 'order-req-macbook-bob' },
        update: {
            buyerId: bob.id,
            saleItemId: macbookItem.id,
            status: OrderRequestStatus.PENDING,
        },
        create: {
            id: 'order-req-macbook-bob',
            buyerId: bob.id,
            saleItemId: macbookItem.id,
            status: OrderRequestStatus.PENDING,
        },
    })

    const iphoneOrder = await prisma.order.upsert({
        where: { id: 'order-iphone-bob' },
        update: {
            buyerId: bob.id,
            totalPrice: new Prisma.Decimal('28900.00'),
            status: OrderStatus.TO_SHIP,
            paymentSnapshot: {
                seller: alice.username,
                bankName: 'KBANK',
                bankAccount: '123-4-56789-0',
            },
            paymentInfo: 'โอนผ่าน PromptPay 080-000-0001',
            trackingNumber: 'TH1234567890',
        },
        create: {
            id: 'order-iphone-bob',
            buyerId: bob.id,
            totalPrice: new Prisma.Decimal('28900.00'),
            status: OrderStatus.TO_PAY,
            paymentSnapshot: {
                seller: alice.username,
                bankName: 'KBANK',
                bankAccount: '123-4-56789-0',
            },
            paymentSlipUrl: 'https://placehold.co/600x800?text=Payment+Slip',
            items: {
                create: [
                    {
                        id: 'order-item-iphone',
                        saleItemId: iphoneItem.id,
                        quantity: 1,
                        price: new Prisma.Decimal('28900.00'),
                    },
                ],
            },
        },
    })

    await prisma.orderItem.upsert({
        where: { id: 'order-item-iphone' },
        update: {
            orderId: iphoneOrder.id,
            saleItemId: iphoneItem.id,
            quantity: 1,
            price: new Prisma.Decimal('28900.00'),
        },
        create: {
            id: 'order-item-iphone',
            orderId: iphoneOrder.id,
            saleItemId: iphoneItem.id,
            quantity: 1,
            price: new Prisma.Decimal('28900.00'),
        },
    })

    await prisma.orderRequest.update({
        where: { id: iphoneRequest.id },
        data: { orderId: iphoneOrder.id, status: OrderRequestStatus.APPROVED },
    })

    console.log('🎉 Seeding completed')
}

main()
    .catch((err) => {
        console.error('Seeding failed', err)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })