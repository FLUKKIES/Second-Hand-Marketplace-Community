import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';

export enum OfferAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  COUNTER = 'COUNTER',
}

export class RespondOfferDto {
  @IsEnum(OfferAction)
  action: OfferAction;

  // note: used as sellerNote on ACCEPT/REJECT, or negotiationNote on COUNTER
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  counterPrice?: number; // Required when action is COUNTER
}
