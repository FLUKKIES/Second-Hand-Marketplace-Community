import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsNumber()
    parentId?: number; // ถ้าเป็นหมวดหมู่ย่อย ให้ส่ง ID แม่มา

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsString()
    backgroundUrl?: string;
}
