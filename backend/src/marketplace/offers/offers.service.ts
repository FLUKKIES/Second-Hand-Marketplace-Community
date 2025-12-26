import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
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

        const offer = await this.prisma.offer.create({
            data: {
                buyerId,
                productId: dto.productId,
                offeredPrice: dto.offeredPrice,
                buyerNote: dto.buyerNote,
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

    // 2. Respond Offer (Accept/Reject)
    async respond(sellerId: string, offerId: string, dto: RespondOfferDto) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { product: { include: { post: true } } }
        });

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.product.post.authorId !== sellerId) throw new ForbiddenException('Not owner of this product');
        if (offer.status !== OfferStatus.PENDING) throw new BadRequestException('Offer is already processed');

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

        if (dto.action === OfferAction.ACCEPT) {
            if (offer.product.stock <= 0) throw new BadRequestException('Product is out of stock now');

            const seller = await this.prisma.user.findUnique({
                where: { id: sellerId },
                select: {
                    username: true,
                    bankAccounts: { include: { bank: true } }
                }
            });

            const bankAccount = seller?.bankAccounts.find(b => b.isDefault) || seller?.bankAccounts[0];

            if (!seller || !bankAccount) {
                throw new BadRequestException('Please setup bank account before accepting offers');
            }

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

                // 2. Create Order
                const order = await tx.order.create({
                    data: {
                        buyerId: offer.buyerId,
                        sellerId: sellerId,
                        totalPrice: offer.offeredPrice,
                        status: OrderStatus.TO_PAY,
                        shippingAddress: 'Please update shipping address',
                        paymentSnapshot: paymentSnapshot as any,
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
                status: OfferStatus.PENDING
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
}
