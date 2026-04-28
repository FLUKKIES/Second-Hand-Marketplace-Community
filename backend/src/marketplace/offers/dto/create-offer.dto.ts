import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  offeredPrice: number;

  @IsOptional()
  @IsString()
  buyerNote?: string;
}
