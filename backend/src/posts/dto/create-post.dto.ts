import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

enum PostType {
    GENERAL = 'GENERAL',
    SALE = 'SALE',
}

// DTO สำหรับสินค้าแต่ละชิ้น (กรณีขายของ)
export class CreateSaleItemDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(1) // ราคาต้องไม่ติดลบ
    price: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    imageUrl: string; // URL ของรูปที่อัปโหลดแล้ว

    @IsNumber()
    @Min(1)
    stock: number;
}

export class CreatePostDto {
    @IsString()
    content: string;

    @IsEnum(PostType)
    type: PostType;

    @IsOptional()
    @IsNumber()
    categoryId?: number;

    // --- กรณี General Post หรือ ใช้เป็น "ภาพปก/ภาพโฆษณา" สำหรับ Sale Post ได้ด้วย ---
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[]; // Array ของ URL รูปภาพ

    // --- กรณี Sale Post ---
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleItemDto)
    saleItems?: CreateSaleItemDto[];
}