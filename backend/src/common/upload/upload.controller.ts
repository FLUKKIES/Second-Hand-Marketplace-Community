import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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

  // เพิ่มอันนี้: สำหรับรูปหมวดหมู่
  @Post('category')
  @UseInterceptors(FileInterceptor('file', multerOptions('categories'))) // เก็บใน uploads/categories
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'categories');
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file', multerOptions('products'))) // เก็บใน uploads/products
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'products');
  }

  @Post('slip')
  @UseInterceptors(FileInterceptor('file', multerOptions('slips'))) // เก็บใน uploads/slips
  async uploadSlipImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'slips');
  }

  @Post('group/profile')
  @UseInterceptors(FileInterceptor('file', multerOptions('groups/profiles')))
  async uploadGroupProfile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'groups/profiles');
  }

  @Post('group/cover')
  @UseInterceptors(FileInterceptor('file', multerOptions('groups/covers')))
  async uploadGroupCover(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'groups/covers');
  }

  @Post('bank')
  @UseInterceptors(FileInterceptor('file', multerOptions('banks')))
  async uploadBankIcon(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUploadedFile(file, 'banks');
  }
}
