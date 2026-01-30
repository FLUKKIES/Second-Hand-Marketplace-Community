import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferAction, RespondOfferDto } from './dto/respond-offer.dto';
import { OfferStatus, OrderStatus } from '@prisma/client';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OffersService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2
    ) { }

    // 1. Make Offer
    async create(buyerId: string, dto: CreateOfferDto) {
        // *** NEW: Validate buyer has shipping address ***
        const buyerAddresses = await this.prisma.address.findMany({
            where: { userId: buyerId }
        });

        if (!buyerAddresses || buyerAddresses.length === 0) {
            throw new BadRequestException('Please add a shipping address before making an offer');
        }

        // ... (validation checks) ...
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
            include: { post: true }
        });

        if (!product) throw new NotFoundException('Product not found');
        if (product.post.authorId === buyerId) throw new BadRequestException('Cannot offer your own product');
        if (product.stock <= 0) throw new BadRequestException('Product is out of stock');

        const existingOffer = await this.prisma.offer.findFirst({
            where: {
                buyerId,
                productId: dto.productId,
                status: OfferStatus.PENDING
            }
        });

        if (existingOffer) throw new BadRequestException('You already have a pending offer for this product');

        // *** NEW: Set expiration date (3 days from now) ***
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        const offer = await this.prisma.offer.create({
            data: {
                buyerId,
                productId: dto.productId,
                offeredPrice: dto.offeredPrice,
                buyerNote: dto.buyerNote,
                expiresAt, // *** NEW: Add expiration ***
                status: OfferStatus.PENDING
            },
            include: { product: true }
        });

        // EMIT EVENT: Offer Received (Notify Seller)
        this.eventEmitter.emit('offer.received', {
            sellerId: product.post.authorId,
            offerId: offer.id
        });

        return offer;
    }

    // 2. Respond Offer (Accept/Reject/Counter)
    async respond(sellerId: string, offerId: string, dto: RespondOfferDto) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { product: { include: { post: true } } }
        });

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.product.post.authorId !== sellerId) throw new ForbiddenException('Not owner of this product');
        if (offer.status !== OfferStatus.PENDING && offer.status !== OfferStatus.COUNTER_OFFERED) {
            throw new BadRequestException('Offer is already processed');
        }

        // *** NEW: Check expiration ***
        if (offer.expiresAt && new Date() > offer.expiresAt) {
            await this.prisma.offer.update({
                where: { id: offerId },
                data: { status: OfferStatus.EXPIRED }
            });
            throw new BadRequestException('This offer has expired');
        }

        // REJECT
        if (dto.action === OfferAction.REJECT) {
            const rejectedOffer = await this.prisma.offer.update({
                where: { id: offerId },
                data: {
                    status: OfferStatus.REJECTED,
                    sellerNote: dto.sellerNote
                }
            });

            // EMIT EVENT: Offer Rejected (Notify Buyer)
            this.eventEmitter.emit('offer.rejected', {
                buyerId: offer.buyerId,
                offerId: offer.id
            });

            return rejectedOffer;
        }

        // *** NEW: COUNTER-OFFER ***
        if (dto.action === OfferAction.COUNTER) {
            if (!dto.counterPrice) {
                throw new BadRequestException('Counter price is required');
            }

            const counteredOffer = await this.prisma.offer.update({
                where: { id: offerId },
                data: {
                    status: OfferStatus.COUNTER_OFFERED,
                    counterPrice: dto.counterPrice,
                    counterNote: dto.sellerNote,
                    counterCount: { increment: 1 }
                }
            });

            // EMIT EVENT: Offer Countered (Notify Buyer)
            this.eventEmitter.emit('offer.countered', {
                buyerId: offer.buyerId,
                offerId: offer.id,
                counterPrice: dto.counterPrice
            });

            return counteredOffer;
        }

        // ACCEPT (existing logic continues...)

        if (dto.action === OfferAction.ACCEPT) {
            if (offer.product.stock <= 0) throw new BadRequestException('Product is out of stock now');

            // *** ENHANCED: Validate seller has bank account ***
            const seller = await this.prisma.user.findUnique({
                where: { id: sellerId },
                select: {
                    username: true,
                    bankAccounts: { include: { bank: true } }
                }
            });

            if (!seller || !seller.bankAccounts || seller.bankAccounts.length === 0) {
                throw new BadRequestException('Please add a bank account before accepting offers. Go to Settings → Bank Accounts');
            }

            let bankAccount;
            if (dto.bankAccountId) {
                bankAccount = seller.bankAccounts.find(b => b.id === dto.bankAccountId);
                if (!bankAccount) {
                    throw new BadRequestException('Selected bank account not found');
                }
            } else {
                bankAccount = seller.bankAccounts.find(b => b.isDefault) || seller.bankAccounts[0];
            }

            // *** NEW: Get buyer's default shipping address ***
            const buyerAddresses = await this.prisma.address.findMany({
                where: { userId: offer.buyerId }
            });

            if (!buyerAddresses || buyerAddresses.length === 0) {
                throw new BadRequestException('Buyer has no shipping address. Please ask them to add one first.');
            }

            const defaultAddress = buyerAddresses.find(a => a.isDefault) || buyerAddresses[0];

            // Format shipping address
            const shippingAddress = `${defaultAddress.addressLine1}${defaultAddress.addressLine2 ? ', ' + defaultAddress.addressLine2 : ''}, ${defaultAddress.subDistrict}, ${defaultAddress.district}, ${defaultAddress.province} ${defaultAddress.postalCode}${defaultAddress.phoneNumber ? ' | Tel: ' + defaultAddress.phoneNumber : ''}`;

            return this.prisma.$transaction(async (tx) => {
                // 1. Update Offer
                await tx.offer.update({
                    where: { id: offerId },
                    data: {
                        status: OfferStatus.ACCEPTED,
                        sellerNote: dto.sellerNote
                    }
                });

                // Construct snapshot
                const paymentSnapshot = {
                    sellerName: seller.username,
                    bankName: bankAccount.bank.name,
                    bankAccount: bankAccount.accountNumber,
                    promptPay: ''
                };

                // 2. Create Order with proper shipping address
                const order = await tx.order.create({
                    data: {
                        buyerId: offer.buyerId,
                        sellerId: sellerId,
                        totalPrice: offer.offeredPrice,
                        status: OrderStatus.TO_PAY,
                        shippingAddress: shippingAddress, // *** FIXED: Real address ***
                        paymentSnapshot: paymentSnapshot as any,
                        paymentDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                        items: {
                            create: {
                                productId: offer.productId,
                                price: offer.offeredPrice,
                                quantity: 1
                            }
                        },
                        offers: {
                            connect: { id: offerId }
                        }
                    }
                });

                // 3. Cut Stock
                await tx.product.update({
                    where: { id: offer.productId },
                    data: {
                        stock: { decrement: 1 },
                        isSoldOut: (offer.product.stock - 1) <= 0
                    }
                });

                // EMIT EVENT: Offer Accepted (Notify Buyer)
                this.eventEmitter.emit('offer.accepted', {
                    buyerId: offer.buyerId,
                    offerId: offer.id,
                    orderId: order.id
                });

                return order;
            });
        }
    }

    // 3. Get Incoming offers (Seller)
    async getIncomingOffers(userId: string) {
        return this.prisma.offer.findMany({
            where: {
                product: { post: { authorId: userId } },
                status: { in: [OfferStatus.PENDING, OfferStatus.COUNTER_OFFERED] }
            },
            include: { buyer: { select: { username: true, avatarUrl: true } }, product: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 4. Get My Offers (Buyer)
    async getMyOffers(userId: string) {
        return this.prisma.offer.findMany({
            where: { buyerId: userId },
            include: { product: { include: { post: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    // *** NEW: 5. Buyer Respond to Counter-Offer ***
    async respondToCounter(buyerId: string, offerId: string, action: 'ACCEPT' | 'REJECT') {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { product: { include: { post: true } } }
        });

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.buyerId !== buyerId) throw new ForbiddenException('Not your offer');
        if (offer.status !== OfferStatus.COUNTER_OFFERED) {
            throw new BadRequestException('This offer has not been countered by seller');
        }

        // Check expiration
        if (offer.expiresAt && new Date() > offer.expiresAt) {
            await this.prisma.offer.update({
                where: { id: offerId },
                data: { status: OfferStatus.EXPIRED }
            });
            throw new BadRequestException('This offer has expired');
        }

        if (action === 'REJECT') {
            const rejectedOffer = await this.prisma.offer.update({
                where: { id: offerId },
                data: { status: OfferStatus.REJECTED }
            });

            this.eventEmitter.emit('offer.counter_rejected', {
                sellerId: offer.product.post.authorId,
                offerId: offer.id
            });

            return rejectedOffer;
        }

        // ACCEPT counter-offer - create order with counter price
        if (action === 'ACCEPT') {
            if (!offer.counterPrice) {
                throw new BadRequestException('Counter price not found');
            }

            if (offer.product.stock <= 0) {
                throw new BadRequestException('Product is out of stock now');
            }

            // *** NEW: Ensure counterPrice is not null ***
            const finalPrice = offer.counterPrice;
            if (!finalPrice) {
                throw new BadRequestException('Counter price is required');
            }

            // Get seller's bank account
            const seller = await this.prisma.user.findUnique({
                where: { id: offer.product.post.authorId },
                select: {
                    username: true,
                    bankAccounts: { include: { bank: true } }
                }
            });

            if (!seller || !seller.bankAccounts || seller.bankAccounts.length === 0) {
                throw new BadRequestException('Seller has not set up bank account');
            }

            const bankAccount = seller.bankAccounts.find(b => b.isDefault) || seller.bankAccounts[0];

            // Get buyer's address
            const buyerAddresses = await this.prisma.address.findMany({
                where: { userId: buyerId }
            });

            if (!buyerAddresses || buyerAddresses.length === 0) {
                throw new BadRequestException('You need a shipping address');
            }

            const defaultAddress = buyerAddresses.find(a => a.isDefault) || buyerAddresses[0];
            const shippingAddress = `${defaultAddress.addressLine1}${defaultAddress.addressLine2 ? ', ' + defaultAddress.addressLine2 : ''}, ${defaultAddress.subDistrict}, ${defaultAddress.district}, ${defaultAddress.province} ${defaultAddress.postalCode}${defaultAddress.phoneNumber ? ' | Tel: ' + defaultAddress.phoneNumber : ''}`;

            return this.prisma.$transaction(async (tx) => {
                await tx.offer.update({
                    where: { id: offerId },
                    data: { status: OfferStatus.ACCEPTED }
                });

                const paymentSnapshot = {
                    sellerName: seller.username,
                    bankName: bankAccount.bank.name,
                    bankAccount: bankAccount.accountNumber,
                    promptPay: ''
                };

                const order = await tx.order.create({
                    data: {
                        buyerId: buyerId,
                        sellerId: offer.product.post.authorId,
                        totalPrice: finalPrice, // *** Use validated counter price ***
                        status: OrderStatus.TO_PAY,
                        shippingAddress: shippingAddress,
                        paymentSnapshot: paymentSnapshot as any,
                        paymentDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                        items: {
                            create: {
                                productId: offer.productId,
                                price: finalPrice, // *** Use validated counter price ***
                                quantity: 1
                            }
                        },
                        offers: {
                            connect: { id: offerId }
                        }
                    }
                });

                await tx.product.update({
                    where: { id: offer.productId },
                    data: {
                        stock: { decrement: 1 },
                        isSoldOut: (offer.product.stock - 1) <= 0
                    }
                });

                this.eventEmitter.emit('offer.counter_accepted', {
                    sellerId: offer.product.post.authorId,
                    offerId: offer.id,
                    orderId: order.id
                });

                return order;
            });
        }
    }
    // 6. Cron Job: Expire Offers
    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        const expiredOffers = await this.prisma.offer.updateMany({
            where: {
                status: { in: [OfferStatus.PENDING, OfferStatus.COUNTER_OFFERED] },
                expiresAt: { lt: new Date() }
            },
            data: {
                status: OfferStatus.EXPIRED
            }
        });

        if (expiredOffers.count > 0) {
            console.log(`[Cron] Expired ${expiredOffers.count} offers`);
        }
    }
}
