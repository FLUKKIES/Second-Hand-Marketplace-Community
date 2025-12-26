import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOption {
    LATEST = 'LATEST',       // ใหม่สุด
    OLDEST = 'OLDEST',       // เก่าสุด
    POPULAR = 'POPULAR',     // ไลค์เยอะสุด
    PRICE_ASC = 'PRICE_ASC', // ราคาต่ำ->สูง
    PRICE_DESC = 'PRICE_DESC' // ราคาสูง->ต่ำ
}

export class SearchPostDto {
    @IsOptional()
    @IsString()
    keyword?: string; // คำค้นหา (เช่น "iPhone 13")

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    categoryId?: number; // ค้นหาทุกกลุ่มในหมวดนี้

    @IsOptional()
    @IsString()
    groupId?: string; // เจาะจงกลุ่ม

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
