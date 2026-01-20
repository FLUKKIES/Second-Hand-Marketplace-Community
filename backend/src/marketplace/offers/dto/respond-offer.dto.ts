import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';

export enum OfferAction {
    ACCEPT = 'ACCEPT',
    REJECT = 'REJECT',
    COUNTER = 'COUNTER' // NEW
}

export class RespondOfferDto {
    @IsEnum(OfferAction)
    action: OfferAction;

    @IsOptional()
    @IsString()
    sellerNote?: string;

    @IsOptional()
    @IsNumber()
    counterPrice?: number; // NEW: Required when action is COUNTER

    @IsOptional()
    @IsString()
    bankAccountId?: string; // NEW: Optional for ACCEPT action (if multiple accounts)
}
