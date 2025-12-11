import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { BatchRespondDto } from './dto/batch-respond.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

@UseGuards(AuthGuard('jwt')) // บังคับ Login ทุก Route ในนี้
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // 1. ผู้ซื้อ: สร้างคำขอจอง (ทีละชิ้น)
    // POST /orders/request
    @Post('request')
    createRequest(
        @GetUser('sub') userId: string,
        @Body() dto: CreateOrderRequestDto
    ) {
        return this.ordersService.createRequest(userId, dto);
    }

    // 2. ผู้ขาย: ตอบรับแบบมัดรวม (เลือกหลาย ID แล้ว Approve ทีเดียว)
    // POST /orders/respond-batch
    @Post('respond-batch')
    batchRespond(
        @GetUser('sub') userId: string,
        @Body() dto: BatchRespondDto,
    ) {
        return this.ordersService.batchRespond(userId, dto);
    }

    // 3. ผู้ขาย: ดูรายการที่มีคนมาขอซื้อ (Incoming)
    // GET /orders/seller/requests
    @Get('seller/requests')
    getIncomingRequests(@GetUser('sub') userId: string) {
        return this.ordersService.getIncomingRequests(userId);
    }

    // 4. ผู้ซื้อ: ดูประวัติการขอซื้อของตัวเอง
    // GET /orders/buyer/requests
    @Get('buyer/requests')
    getMyRequests(@GetUser('sub') userId: string) {
        return this.ordersService.getMyRequests(userId);
    }
}