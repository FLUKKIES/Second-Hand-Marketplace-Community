import { Injectable, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service'; // เผื่ออนาคตอยากบันทึกข้อมูล

@Injectable()
export class UploadService {

    // จัดการหลังจากไฟล์ถูกเซฟลง Disk แล้ว
    async handleUploadedFile(file: Express.Multer.File, folder: string) {
        if (!file) {
            throw new BadRequestException('File is not an image');
        }

        // Logic: สร้าง Full URL Path
        // ตรงนี้เราอาจจะใส่ logic เพิ่มได้ เช่น:
        // - ย่อขนาดภาพ (Image Resizing)
        // - บันทึกชื่อไฟล์ลง Database
        // - ส่งไฟล์ไป S3 (ถ้าเปลี่ยนใจไม่เก็บในเครื่อง)

        const fileUrl = `/uploads/${folder}/${file.filename}`;

        return {
            url: fileUrl,
            fileName: file.filename,
            size: file.size,
            mimeType: file.mimetype,
        };
    }
}