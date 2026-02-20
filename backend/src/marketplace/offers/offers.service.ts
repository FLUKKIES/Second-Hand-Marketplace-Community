import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferAction, RespondOfferDto } from './dto/respond-offer.dto';
import { CounteredBy, OfferStatus, OrderStatus } from '@prisma/client';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OffersService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2
    ) { }

    // 1. Make Offer (Buyer)
    async create(buyerId: string, dto: CreateOfferDto) {
        const buyerAddresses = await this.prisma.address.findMany({
            where: { userId: buyerId }
        });

        if (!buyerAddresses || buyerAddresses.length === 0) {
            throw new BadRequestException('Please add a shipping address before making an offer');
        }

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

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        const offer = await this.prisma.offer.create({
            data: {
                buyerId,
                productId: dto.productId,
                offeredPrice: dto.offeredPrice,
                buyerNote: dto.buyerNote,
                expiresAt,
                status: OfferStatus.PENDING
            },
            include: { product: true }
        });

        this.eventEmitter.emit('offer.received', {
            sellerId: product.post.authorId,
            offerId: offer.id
        });

        return offer;
    }

    // 1.5 Cancel Offer (Buyer)
    async cancel(userId: string, offerId: string) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { product: { include: { post: true } } }
        });

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.buyerId !== userId) throw new ForbiddenException('You can only cancel your own offers');
        if (offer.status !== OfferStatus.PENDING) {
            throw new BadRequestException('Only pending offers can be cancelled');
        }

        const cancelledOffer = await this.prisma.offer.update({
            where: { id: offerId },
            data: { status: OfferStatus.CANCELLED }
        });

        this.eventEmitter.emit('offer.cancelled', {
            sellerId: offer.product.post.authorId,
            offerId: offer.id
        });

        return cancelledOffer;
    }

    // 2. Respond Offer (Seller: ACCEPT | REJECT | COUNTER)
    async respond(sellerId: string, offerId: string, dto: RespondOfferDto) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { product: { include: { post: true } } }
        });

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.product.post.authorId !== sellerId) throw new ForbiddenException('Not owner of this product');

        // Offer must be PENDING, or COUNTER_OFFERED and it's the seller's turn
        const isSellerTurn =
            offer.status === OfferStatus.PENDING ||
            (offer.status === OfferStatus.COUNTER_OFFERED && offer.lastCounteredBy === CounteredBy.BUYER);

        if (!isSellerTurn) {
            throw new BadRequestException('It is not your turn to respond');
        }

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
                    sellerNote: dto.note
                }
            });

            this.eventEmitter.emit('offer.rejected', {
                buyerId: offer.buyerId,
                offerId: offer.id
            });

            return rejectedOffer;
        }

        // COUNTER
        if (dto.action === OfferAction.COUNTER) {
            if (!dto.counterPrice) {
                throw new BadRequestException('Counter price is required');
            }

            const counteredOffer = await this.prisma.offer.update({
                where: { id: offerId },
                data: {
                    status: OfferStatus.COUNTER_OFFERED,
                    counterPrice: dto.counterPrice,
                    negotiationNote: dto.note,
                    counterCount: { increment: 1 },
                    lastCounteredBy: CounteredBy.SELLER,
                }
            });

            this.eventEmitter.emit('offer.countered', {
                buyerId: offer.buyerId,
                offerId: offer.id,
                counterPrice: dto.counterPrice
            });

            return counteredOffer;
        }

        // ACCEPT
        if (dto.action === OfferAction.ACCEPT) {
            if (offer.product.stock <= 0) throw new BadRequestException('Product is out of stock now');

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

            return this.prisma.$transaction(async (tx) => {
                const acceptedOffer = await tx.offer.update({
                    where: { id: offerId },
                    data: {
                        status: OfferStatus.ACCEPTED,
                        sellerNote: dto.note
                    }
                });

                const updatedProduct = await tx.product.update({
                    where: { id: offer.productId },
                    data: { stock: { decrement: 1 } }
                });

                if (updatedProduct.stock <= 0) {
                    await tx.product.update({
                        where: { id: offer.productId },
                        data: { isSoldOut: true }
                    });

                    await tx.offer.updateMany({
                        where: {
                            productId: offer.productId,
                            id: { not: offerId },
                            status: { in: [OfferStatus.PENDING, OfferStatus.COUNTER_OFFERED] }
                        },
                        data: {
                            status: OfferStatus.REJECTED,
                            sellerNote: 'Item Sold Out'
                        }
                    });
                }

                this.eventEmitter.emit('offer.accepted', {
                    buyerId: offer.buyerId,
                    offerId: offer.id
                });

                return acceptedOffer;
            });
        }
    }

    // 3. Respond to Counter (Buyer: ACCEPT | REJECT | COUNTER)
    async respondToCounter(buyerId: string, offerId: string, dto: RespondOfferDto) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { product: { include: { post: true } } }
        });

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.buyerId !== buyerId) throw new ForbiddenException('Not your offer');

        // Must be COUNTER_OFFERED and it's the buyer's turn (seller countered last)
        if (offer.status !== OfferStatus.COUNTER_OFFERED) {
            throw new BadRequestException('This offer has not been countered');
        }
        if (offer.lastCounteredBy !== CounteredBy.SELLER) {
            throw new BadRequestException('It is not your turn to respond');
        }

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
                data: { status: OfferStatus.REJECTED }
            });

            this.eventEmitter.emit('offer.counter_rejected', {
                sellerId: offer.product.post.authorId,
                offerId: offer.id
            });

            return rejectedOffer;
        }

        // COUNTER (Buyer counter-counters back)
        if (dto.action === OfferAction.COUNTER) {
            if (!dto.counterPrice) {
                throw new BadRequestException('Counter price is required');
            }

            const counteredOffer = await this.prisma.offer.update({
                where: { id: offerId },
                data: {
                    status: OfferStatus.COUNTER_OFFERED,
                    counterPrice: dto.counterPrice,
                    negotiationNote: dto.note,
                    counterCount: { increment: 1 },
                    lastCounteredBy: CounteredBy.BUYER,
                }
            });

            // Notify seller that buyer countered back
            this.eventEmitter.emit('offer.countered', {
                buyerId: offer.buyerId,
                offerId: offer.id,
                counterPrice: dto.counterPrice,
                // We notify the SELLER here, so reuse the event but service handles direction
                sellerId: offer.product.post.authorId,
            });

            return counteredOffer;
        }

        // ACCEPT counter-offer
        if (dto.action === OfferAction.ACCEPT) {
            if (!offer.counterPrice) {
                throw new BadRequestException('Counter price not found');
            }
            if (offer.product.stock <= 0) {
                throw new BadRequestException('Product is out of stock now');
            }

            return this.prisma.$transaction(async (tx) => {
                const acceptedOffer = await tx.offer.update({
                    where: { id: offerId },
                    data: { status: OfferStatus.ACCEPTED }
                });

                const updatedProduct = await tx.product.update({
                    where: { id: offer.productId },
                    data: { stock: { decrement: 1 } }
                });

                if (updatedProduct.stock <= 0) {
                    await tx.product.update({
                        where: { id: offer.productId },
                        data: { isSoldOut: true }
                    });

                    await tx.offer.updateMany({
                        where: {
                            productId: offer.productId,
                            id: { not: offerId },
                            status: { in: [OfferStatus.PENDING, OfferStatus.COUNTER_OFFERED] }
                        },
                        data: {
                            status: OfferStatus.REJECTED,
                            sellerNote: 'Item Sold Out'
                        }
                    });
                }

                this.eventEmitter.emit('offer.counter_accepted', {
                    sellerId: offer.product.post.authorId,
                    offerId: offer.id
                });

                return acceptedOffer;
            });
        }
    }

    // 4. Get Incoming offers (Seller)
    async getIncomingOffers(userId: string) {
        return this.prisma.offer.findMany({
            where: {
                product: { post: { authorId: userId } },
            },
            include: {
                buyer: { select: { id: true, username: true, avatarUrl: true } },
                product: { include: { post: { select: { id: true, shippingCost: true, authorId: true, author: { select: { id: true, username: true, avatarUrl: true } } } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 5. Get My Offers (Buyer)
    async getMyOffers(userId: string) {
        return this.prisma.offer.findMany({
            where: { buyerId: userId },
            include: {
                product: {
                    include: {
                        post: {
                            select: {
                                id: true,
                                shippingCost: true,
                                authorId: true,
                                author: { select: { id: true, username: true, avatarUrl: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 6. Get Accepted Offers without Order (for checkout)
    async getAcceptedOffers(buyerId: string) {
        return this.prisma.offer.findMany({
            where: {
                buyerId: buyerId,
                status: OfferStatus.ACCEPTED,
                orderId: null,
            },
            include: {
                product: {
                    include: {
                        post: {
                            select: {
                                id: true,
                                shippingCost: true,
                                authorId: true,
                                author: { select: { id: true, username: true, avatarUrl: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 7. Cron Job: Expire Offers
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
