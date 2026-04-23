import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BanUserDto {
    @IsOptional()
    @IsNumber()
    durationDays?: number;

    @IsOptional()
    @IsString()
    reason?: string;
}
