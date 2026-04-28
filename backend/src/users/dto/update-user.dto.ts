import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300) // จำกัดความยาว Bio หน่อย
  bio?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string; // สำคัญสำหรับติดต่อ
}
