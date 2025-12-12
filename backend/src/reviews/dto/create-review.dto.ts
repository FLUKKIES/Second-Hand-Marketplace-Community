import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @IsUUID()
    orderId: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number; // 1-5

    @IsString()
    @IsOptional()
    comment?: string;
}