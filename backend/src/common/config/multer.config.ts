import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdir, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ฟังก์ชันสำหรับสร้าง Config ของ Multer ตามชื่อโฟลเดอร์ที่ส่งเข้ามา
export const multerOptions = (folder: string) => {
  return {
    // 1. Storage Config: กำหนดที่เก็บและชื่อไฟล์
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = `./public/uploads/${folder}`;
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
      }, // รับชื่อ folder เข้ามา (avatars หรือ posts)
      filename: (req, file, cb) => {
        // สร้างชื่อไฟล์ใหม่เป็น UUID เพื่อป้องกันชื่อซ้ำ
        const randomName = uuidv4();
        // ดึงนามสกุลไฟล์เดิม (เช่น .jpg, .png)
        const extension = extname(file.originalname);
        // รวมร่าง: uuid + extension
        cb(null, `${randomName}${extension}`);
      },
    }),

    // 2. File Filter: อนุญาตเฉพาะไฟล์รูปภาพ
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        // ถ้าเป็นรูปภาพ -> ผ่าน
        cb(null, true);
      } else {
        // ถ้าไม่ใช่ -> Error
        cb(
          new BadRequestException(
            'Unsupported file type. Only images are allowed.',
          ),
          false,
        );
      }
    },

    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  };
};
