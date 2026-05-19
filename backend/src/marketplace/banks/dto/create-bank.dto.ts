import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBankDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  officialName: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
