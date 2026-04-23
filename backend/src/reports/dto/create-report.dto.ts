import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TargetType } from '@prisma/client';

export class CreateReportDto {
    @IsEnum(TargetType)
    targetType: TargetType;

    @IsString()
    @IsNotEmpty()
    targetId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
