import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PostType {
    NORMAL = 'NORMAL',
    SELLING = 'SELLING',
}

// DTO สำหรับสินค้า (เชื่อมกับ Table Product)
export class CreateProductDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    description?: string;

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
    @IsString()
    groupId?: string; // รองรับการโพสต์ลงกลุ่ม (Optional)

    // --- กรณี Normal Post หรือ ใช้เป็น "ภาพปก/ภาพประกอบ" ---
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[]; // Array ของ URL รูปภาพ

    // --- กรณี Selling Post (สินค้าได้หลายชิ้น) ---
    @IsOptional()
    @ValidateNested({ each: true })
    @IsArray()
    @Type(() => CreateProductDto)
    products?: CreateProductDto[];
}
