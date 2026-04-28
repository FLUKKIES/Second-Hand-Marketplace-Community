import { Test, TestingModule } from '@nestjs/testing';
import { OffersService } from './offers.service';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CounteredBy, OfferStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OfferAction } from './dto/respond-offer.dto';

describe('OffersService', () => {
    let service: OffersService;
    let prisma: PrismaService;
    let eventEmitter: EventEmitter2;

    const mockPrismaService = {
        offer: {
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        product: {
            update: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockEventEmitter = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OffersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<OffersService>(OffersService);
        prisma = module.get<PrismaService>(PrismaService);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('respond (Seller responding to an Offer)', () => {
        const sellerId = 'seller-123';
        const buyerId = 'buyer-456';
        const offerId = 'offer-789';
        const productId = 'product-111';

        const mockOfferBase = {
            id: offerId,
            buyerId,
            productId,
            status: OfferStatus.PENDING,
            product: {
                id: productId,
                stock: 1,
                post: { authorId: sellerId },
            },
        };

        it('should throw NotFoundException if offer is not found', async () => {
            mockPrismaService.offer.findUnique.mockResolvedValueOnce(null);

            await expect(
                service.respond(sellerId, offerId, { action: OfferAction.REJECT })
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user is not the product owner', async () => {
            mockPrismaService.offer.findUnique.mockResolvedValueOnce({
                ...mockOfferBase,
                product: { post: { authorId: 'wrong-seller' } },
            });

            await expect(
                service.respond(sellerId, offerId, { action: OfferAction.REJECT })
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if it is not the seller turn', async () => {
            mockPrismaService.offer.findUnique.mockResolvedValueOnce({
                ...mockOfferBase,
                status: OfferStatus.COUNTER_OFFERED,
                lastCounteredBy: CounteredBy.SELLER, // Seller already countered, waiting for buyer
            });

            await expect(
                service.respond(sellerId, offerId, { action: OfferAction.REJECT })
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject an offer', async () => {
            mockPrismaService.offer.findUnique.mockResolvedValueOnce(mockOfferBase);
            mockPrismaService.offer.update.mockResolvedValueOnce({ ...mockOfferBase, status: OfferStatus.REJECTED });

            const result = await service.respond(sellerId, offerId, { action: OfferAction.REJECT, note: 'No thanks' });

            expect(prisma.offer.update).toHaveBeenCalledWith({
                where: { id: offerId },
                data: { status: OfferStatus.REJECTED, sellerNote: 'No thanks' },
            });
            expect(eventEmitter.emit).toHaveBeenCalledWith('offer.rejected', expect.any(Object));
            expect(result?.status).toBe(OfferStatus.REJECTED);
        });

        it('should counter an offer', async () => {
            mockPrismaService.offer.findUnique.mockResolvedValueOnce(mockOfferBase);
            mockPrismaService.offer.update.mockResolvedValueOnce({
                ...mockOfferBase,
                status: OfferStatus.COUNTER_OFFERED,
                counterPrice: 100,
            });

            const result = await service.respond(sellerId, offerId, {
                action: OfferAction.COUNTER,
                counterPrice: 100,
                note: 'How about 100?',
            });

            expect(prisma.offer.update).toHaveBeenCalledWith({
                where: { id: offerId },
                data: {
                    status: OfferStatus.COUNTER_OFFERED,
                    counterPrice: 100,
                    negotiationNote: 'How about 100?',
                    counterCount: { increment: 1 },
                    lastCounteredBy: CounteredBy.SELLER,
                },
            });
            expect(eventEmitter.emit).toHaveBeenCalledWith('offer.countered', expect.any(Object));
            expect(result?.status).toBe(OfferStatus.COUNTER_OFFERED);
        });

        it('should accept an offer and decrement stock', async () => {
            mockPrismaService.offer.findUnique.mockResolvedValueOnce(mockOfferBase);
            mockPrismaService.offer.update.mockResolvedValueOnce({
                ...mockOfferBase,
                status: OfferStatus.ACCEPTED,
            });
            mockPrismaService.product.update.mockResolvedValueOnce({ id: productId, stock: 0 });

            const result = await service.respond(sellerId, offerId, { action: OfferAction.ACCEPT });

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.offer.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: offerId },
                data: expect.objectContaining({ status: OfferStatus.ACCEPTED }),
            }));
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: productId },
                data: { stock: { decrement: 1 } },
            });
            // Should set isSoldOut to true since stock became 0
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: productId },
                data: { isSoldOut: true },
            });
            expect(eventEmitter.emit).toHaveBeenCalledWith('offer.accepted', expect.any(Object));
        });
    });
});
