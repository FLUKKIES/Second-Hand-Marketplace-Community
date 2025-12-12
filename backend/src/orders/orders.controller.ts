import { Controller, Post, Body, UseGuards, Get, Patch, Param} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { BatchRespondDto } from './dto/batch-respond.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { ConfirmPaymentDto } from './dto/order-action.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post('request')
    createRequest(@GetUser('userId') userId: string, @Body() dto: CreateOrderRequestDto) {
        return this.ordersService.createRequest(userId, dto);
    }

    @Post('respond-batch')
    batchRespond(@GetUser('userId') userId: string, @Body() dto: BatchRespondDto) {
        return this.ordersService.batchRespond(userId, dto);
    }

    @Get('seller/requests')
    getIncomingRequests(@GetUser('userId') userId: string) {
        return this.ordersService.getIncomingRequests(userId);
    }

    @Get('buyer/requests')
    getMyRequests(@GetUser('userId') userId: string) {
        return this.ordersService.getMyRequests(userId);
    }

    // 1. ผู้ซื้อแจ้งโอนเงิน
    @Patch(':id/pay') // PATCH /orders/uuid/pay
    confirmPayment(
        @Param('id') orderId: string,
        @GetUser('userId') userId: string,
        @Body() dto: ConfirmPaymentDto
    ) {
        return this.ordersService.confirmPayment(userId, orderId, dto);
    }

    // 2. ผู้ขายแจ้งส่งของ
    @Patch(':id/ship') // PATCH /orders/uuid/ship
    markAsShipped(
        @Param('id') orderId: string,
        @GetUser('userId') userId: string
    ) {
        return this.ordersService.markAsShipped(userId, orderId);
    }

    // 3. ผู้ซื้อกดรับสินค้า
    @Patch(':id/receive') // PATCH /orders/uuid/receive
    markAsReceived(
        @Param('id') orderId: string,
        @GetUser('userId') userId: string
    ) {
        return this.ordersService.markAsReceived(userId, orderId);
    }

    // 4. ยกเลิกออเดอร์
    @Patch(':id/cancel') // PATCH /orders/uuid/cancel
    cancelOrder(
        @Param('id') orderId: string,
        @GetUser('userId') userId: string
    ) {
        return this.ordersService.cancelOrder(userId, orderId);
    }
}