import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderFromOffersDto {
    @IsArray()
    @IsString({ each: true })
    offerIds: string[];

    @IsString()
    @IsNotEmpty()
    shippingAddress: string;

    @IsString()
    @IsNotEmpty()
    paymentSlipUrl: string;
}
