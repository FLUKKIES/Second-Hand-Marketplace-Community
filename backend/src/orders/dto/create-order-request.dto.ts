import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOrderRequestDto {
    @IsUUID()
    @IsNotEmpty()
    saleItemId: string; // ID ของสินค้าที่ต้องการจอง
}