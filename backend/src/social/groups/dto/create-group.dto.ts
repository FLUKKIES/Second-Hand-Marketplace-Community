import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUrl,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  backgroundUrl?: string;
}
