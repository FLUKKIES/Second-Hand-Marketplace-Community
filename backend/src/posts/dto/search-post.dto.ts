import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOption {
    LATEST = 'LATEST',       // ใหม่สุด
    OLDEST = 'OLDEST',       // เก่าสุด
    POPULAR = 'POPULAR',     // ไลค์เยอะสุด
    // PRICE_ASC, PRICE_DESC (ทำยากในโครงสร้างนี้ เพราะ 1 โพสต์มีหลายราคา แนะนำให้กรอง Min/Max เอา)
}

export class SearchPostDto {
    @IsOptional()
    @IsString()
    keyword?: string; // คำค้นหา (เช่น "iPhone 13")

    @IsOptional()
    @Type(() => Number) // แปลงจาก String ใน URL เป็น Number
    @IsNumber()
    categoryId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;

    @IsOptional()
    @IsEnum(SortOption)
    sortBy?: SortOption = SortOption.LATEST; // Default เป็นใหม่สุด
}