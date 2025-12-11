import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(300) // จำกัดความยาว Bio หน่อย
    bio?: string;

    @IsOptional()
    @IsString()
    address?: string; // สำคัญสำหรับส่งของ

    @IsOptional()
    @IsString()
    phoneNumber?: string; // สำคัญสำหรับติดต่อ
}
