import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePostDto, CreateProductDto } from './create-post.dto';
import {
  ValidateNested,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}

export class UpdatePostDto extends PartialType(
  OmitType(CreatePostDto, ['products'] as const),
) {
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => UpdateProductDto)
  products?: UpdateProductDto[];
}
