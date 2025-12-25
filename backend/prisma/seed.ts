import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
    OrderStatus,
    PostType,
    Prisma,
    PrismaClient,
    Role,
    OfferStatus
} from '@prisma/client'
import slugify from 'slugify'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Start seeding...')

    // 0. Seed Banks (Master Data)
    const banks = await Promise.all([
        prisma.bank.upsert({ where: { code: 'kbank' }, update: {}, create: { code: 'kbank', name: 'Kasikorn Bank', officialName: 'ธนาคารกสิกรไทย' } }),
        prisma.bank.upsert({ where: { code: 'scb' }, update: {}, create: { code: 'scb', name: 'Siam Commercial Bank', officialName: 'ธนาคารไทยพาณิชย์' } }),
        prisma.bank.upsert({ where: { code: 'bbl' }, update: {}, create: { code: 'bbl', name: 'Bangkok Bank', officialName: 'ธนาคารกรุงเทพ' } }),
    ])
    const kbank = banks.find(b => b.code === 'kbank')!

    console.log('✅ Banks ready')

    // 1. Users
    const [admin, alice, bob] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@admin.com' },
            update: {},
            create: {
                email: 'admin@admin.com',
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                role: Role.ADMIN,
            },
        }),
        prisma.user.upsert({
            where: { email: 'alice@smarket.com' },
            update: {
                username: 'alice',
                firstName: 'Alice',
                lastName: 'Seller',
                bio: 'Seller focusing on second-hand gadgets',
                phoneNumber: '080-000-0001',
            },
            create: {
                email: 'alice@smarket.com',
                username: 'alice',
                firstName: 'Alice',
                lastName: 'Seller',
                role: Role.USER,
                bio: 'Seller focusing on second-hand gadgets',
                phoneNumber: '080-000-0001',
                addresses: {
                    create: {
                        label: 'Home',
                        addressLine1: '123/45 Condo',
                        subDistrict: 'Khlong Toei',
                        district: 'Khlong Toei',
                        province: 'Bangkok',
                        postalCode: '10110',
                        isDefault: true
                    }
                },
                bankAccounts: {
                    create: {
                        bankId: kbank.id,
                        accountName: 'Alice Seller',
                        accountNumber: '123-456-7890',
                        isDefault: true
                    }
                }
            },
        }),
        prisma.user.upsert({
            where: { email: 'bob@smarket.com' },
            update: {
                username: 'bob',
                firstName: 'Bob',
                lastName: 'Buyer',
                bio: 'Casual buyer, loves bargains',
                phoneNumber: '081-000-0002',
            },
            create: {
                email: 'bob@smarket.com',
                username: 'bob',
                firstName: 'Bob',
                lastName: 'Buyer',
                role: Role.USER,
                bio: 'Casual buyer, loves bargains',
                phoneNumber: '081-000-0002',
                addresses: {
                    create: {
                        label: 'Home',
                        addressLine1: '999/99 Village',
                        subDistrict: 'Samsen Nai',
                        district: 'Phaya Thai',
                        province: 'Bangkok',
                        postalCode: '10400',
                        isDefault: true
                    }
                }
            },
        }),
    ])

    console.log('✅ Users ready')

    // 2. Categories
    const electronics = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: { name: 'Electronics' },
        create: {
            name: 'Electronics',
            slug: 'electronics',
            imageUrl: 'https://placehold.co/120x120?text=Electronics',
        },
    })

    const mobilePhones = await prisma.category.upsert({
        where: { slug: 'mobile-phones' },
        update: {
            name: 'Mobile Phones',
        },
        create: {
            name: 'Mobile Phones',
            slug: slugify('Mobile Phones', { lower: true }),
            imageUrl: 'https://placehold.co/120x120?text=Phones',
        },
    })

    const laptops = await prisma.category.upsert({
        where: { slug: 'laptops' },
        update: {
            name: 'Laptops',
        },
        create: {
            name: 'Laptops',
            slug: slugify('Laptops', { lower: true }),
            imageUrl: 'https://placehold.co/120x120?text=Laptops',
        },
    })

    console.log('✅ Categories ready')

    // 3. Groups (New)
    const generalGroup = await prisma.group.create({
        data: {
            name: 'General Discussion',
            categoryId: electronics.id,
            description: 'Discuss anything related to electronics',
            members: {
                create: [
                    { userId: alice.id, role: 'ADMIN' },
                    { userId: bob.id, role: 'MEMBER' }
                ]
            }
        }
    })

    const mobileGroup = await prisma.group.create({
        data: {
            name: 'Mobile Lovers',
            categoryId: mobilePhones.id,
            description: 'Buy and sell mobile phones',
            members: {
                create: [
                    { userId: alice.id, role: 'ADMIN' }
                ]
            }
        }
    })

    console.log('✅ Groups ready')

    // 4. Posts & Products
    // Post 1: Selling iPhone (Alice)
    const iphonePost = await prisma.post.create({
        data: {
            content: 'ขาย iPhone 14 Pro 128GB สี Space Black สภาพสวย แบต 92% ครบกล่อง',
            type: PostType.SELLING,
            authorId: alice.id,
            groupId: mobileGroup.id,
            products: {
                create: [
                   {
                        name: 'iPhone 14 Pro 128GB',
                        price: new Prisma.Decimal('28900.00'),
                        description: 'เครื่องไทย ประกันศูนย์ เหลืออุปกรณ์ครบชุด',
                        stock: 1,
                        isSoldOut: false,
                   }
                ]
            },
            images: {
                create: [
                    { url: 'https://placehold.co/800x800?text=iPhone+Front' },
                    { url: 'https://placehold.co/800x800?text=iPhone+Back' }
                ]
            }
        },
        include: { products: true } // Relation changed
    })

    // Post 2: Selling MacBook (Alice)
    const macbookPost = await prisma.post.create({
        data: {
            content: 'MacBook Air M1 16GB/512GB ใช้งานถนอม',
            type: PostType.SELLING,
            authorId: alice.id,
            groupId: generalGroup.id, // Group for Laptops? Or General
            products: {
                create: [
                    {
                        name: 'MacBook Air M1 16/512',
                        price: new Prisma.Decimal('39900.00'),
                        description: 'ใส่เคสตลอด ไม่มีรอยบิ่น แถมซอฟต์แวร์ Office',
                        stock: 2,
                        isSoldOut: false,
                    }
                ]
            },
            images: {
                create: [
                    { url: 'https://placehold.co/900x600?text=MacBook+Air' }
                ]
            }
        },
        include: { products: true }
    })

    // Post 3: General Question (Bob)
    const helloPost = await prisma.post.create({
        data: {
            content: 'สวัสดีทุกคนใน community มีใครแนะนำร้านรับฝากขายไหมครับ?',
            type: PostType.NORMAL,
            authorId: bob.id,
            groupId: generalGroup.id,
            comments: {
                create: {
                    content: 'แนะนำลองใช้ระบบ Escrow ในแพลตฟอร์มนี้เลยครับ ปลอดภัยกว่า',
                    userId: alice.id
                }
            },
            likes: {
                create: { userId: alice.id }
            }
        }
    })

    console.log('✅ Posts & Products ready')

    // 5. Offers (Negotiation)
    // Bob offers for MacBook
    if (macbookPost.products && macbookPost.products.length > 0) {
        await prisma.offer.create({
            data: {
                buyerId: bob.id,
                productId: macbookPost.products[0].id, // Use first product
                offeredPrice: 38000.00,
                buyerNote: 'ลดได้อีกไหมครับ รับเอง',
                status: OfferStatus.PENDING
            }
        })
    }

    // 6. Orders
    // Bob buys iPhone directly
    if (iphonePost.products && iphonePost.products.length > 0) {
        const product = iphonePost.products[0];
        // Create Order Directly
        const order = await prisma.order.create({
            data: {
                buyerId: bob.id,
                sellerId: alice.id,
                totalPrice: new Prisma.Decimal('28900.00'),
                status: OrderStatus.TO_PAY,
                shippingAddress: '123 Wireless Road, Bangkok',
                paymentSnapshot: {
                    seller: alice.username,
                    bankName: 'KBANK', // Hardcoded as per previous logic or use relation
                    bankAccount: '123-456-7890',
                    promptPay: '080-000-0001'
                } as any,
                items: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: new Prisma.Decimal('28900.00')
                    }
                }
            }
        })

        // Decrement stock
        await prisma.product.update({
            where: { id: product.id },
            data: {
                stock: { decrement: 1 },
                isSoldOut: true
            }
        })


        console.log(`✅ Order created: ${order.id}`)
    }

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