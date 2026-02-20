import { IsArray, IsString } from 'class-validator';

export class CreateOrderFromOffersDto {
    @IsArray()
    @IsString({ each: true })
    offerIds: string[];
}
