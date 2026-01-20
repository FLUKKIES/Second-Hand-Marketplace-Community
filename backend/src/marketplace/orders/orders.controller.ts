import { Controller, Post, Body, UseGuards, Get, Patch, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { ConfirmPaymentDto, ShipOrderDto } from './dto/order-action.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post('create')
    createOrder(@GetUser('userId') userId: string, @Body() dto: CreateOrderDto) {
        return this.ordersService.createOrder(userId, dto);
    }

    @Get('buying')
    getMyBuyingOrders(@GetUser('userId') userId: string) {
        return this.ordersService.getMyBuyingOrders(userId);
    }

    @Get('selling')
    getMySellingOrders(@GetUser('userId') userId: string) {
        return this.ordersService.getMySellingOrders(userId);
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
        @GetUser('userId') userId: string,
        @Body() dto: ShipOrderDto
    ) {
        return this.ordersService.markAsShipped(userId, orderId, dto);
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
