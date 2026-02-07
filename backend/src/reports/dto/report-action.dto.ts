import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ReportAction {
    WARN = 'WARN',
    TEMP_BAN = 'TEMP_BAN',
    PERMA_BAN = 'PERMA_BAN',
    DISMISS = 'DISMISS',
}

export class ReportActionDto {
    @IsEnum(ReportAction)
    action: ReportAction;

    @IsString()
    @IsOptional()
    adminNotes?: string;

    // For TEMP_BAN (days)
    @IsNumber()
    @Min(1)
    @IsOptional()
    banDurationDays?: number;

    // For WARN
    @IsString()
    @IsOptional()
    warningMessage?: string;
}
