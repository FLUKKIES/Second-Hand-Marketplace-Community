import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsUUID()
    postId: string; // รับ postId มาเพื่อบอกว่าจะคอมเมนต์โพสต์ไหน
}