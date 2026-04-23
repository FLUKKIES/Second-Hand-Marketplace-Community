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
    
    async deleteFile(fileUrl: string) {
        try {
            // Check if it's a relative path from our system
            if (!fileUrl.includes('/uploads/')) return;

            // Extract the path after /uploads/ (including /uploads/)
            // Example: /uploads/categories/abc.jpg or http://.../uploads/categories/abc.jpg
            const relativePath = fileUrl.substring(fileUrl.indexOf('/uploads/'));

            const path = require('path');
            const fs = require('fs');

            // Construct absolute path
            const filePath = path.join(process.cwd(), 'public', relativePath);

            console.log(`[UploadService] Attempting to delete file: ${filePath}`);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[UploadService] Deleted file successfully`);
            } else {
                console.warn(`[UploadService] File not found for deletion: ${filePath}`);
            }
        } catch (error) {
            console.error(`[UploadService] Failed to delete file: ${fileUrl}`, error);
        }
    }
}
