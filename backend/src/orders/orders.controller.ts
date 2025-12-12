import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { BatchRespondDto } from './dto/batch-respond.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

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
}