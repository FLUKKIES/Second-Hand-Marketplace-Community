import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../config/multer.config';
import { UploadService } from './upload.service'; // Import Service

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', multerOptions('avatars')))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'avatars');
  }

  @Post('post')
  @UseInterceptors(FileInterceptor('file', multerOptions('posts')))
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'posts');
  }
}