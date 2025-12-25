import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OfferAction {
    ACCEPT = 'ACCEPT',
    REJECT = 'REJECT'
}

export class RespondOfferDto {
    @IsEnum(OfferAction)
    action: OfferAction;

    @IsOptional()
    @IsString()
    sellerNote?: string;
}
