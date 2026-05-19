import * as argon2 from 'argon2'
import {
    PrismaClient,
    Role,
} from '@prisma/client'


const prisma = new PrismaClient()

// Helper for Embedding


async function main() {
    console.log('🌱 Start seeding...')

    // Hash password for Admin
    const adminPassword = await argon2.hash('admin123');

    // 0. Seed Banks (Master Data)
    const banks = await Promise.all([
        prisma.bank.upsert({ where: { code: 'kbank' }, update: {}, create: { code: 'kbank', name: 'Kasikorn Bank', officialName: 'ธนาคารกสิกรไทย' } }),
        prisma.bank.upsert({ where: { code: 'scb' }, update: {}, create: { code: 'scb', name: 'Siam Commercial Bank', officialName: 'ธนาคารไทยพาณิชย์' } }),
        prisma.bank.upsert({ where: { code: 'bbl' }, update: {}, create: { code: 'bbl', name: 'Bangkok Bank', officialName: 'ธนาคารกรุงเทพ' } }),
    ])
    const kbank = banks.find(b => b.code === 'kbank')!

    console.log('✅ Banks ready')

    // 1. Users
    const [
        admin,
        // alice, bob, charlie, diana
    ] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@admin.com' },
            update: {
                password: adminPassword,
                acceptedTermsAt: new Date(), // Admin always accepted
            },
            create: {
                email: 'admin@admin.com',
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                role: Role.ADMIN,
                password: adminPassword,
                acceptedTermsAt: new Date(), // Admin always accepted
            },
        }),
    ])

    console.log('✅ Users ready')
    console.log('User Logins:')
    console.log('Admin: admin@admin.com / admin123')

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