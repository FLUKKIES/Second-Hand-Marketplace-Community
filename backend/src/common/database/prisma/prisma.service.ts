import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. สร้าง Connection Pool
    const connectionString = `${process.env.DATABASE_URL}`;
    console.log(process.env.DATABASE_URL);
    const pool = new Pool({ connectionString });

    // 2. สร้าง Adapter
    const adapter = new PrismaPg(pool);

    // 3. ส่ง Adapter เข้าไปใน PrismaClient ผ่าน super()
    super({ adapter });
  }

  async onModuleInit() {
    // เชื่อมต่อเมื่อ Module เริ่มทำงาน
    await this.$connect();
  }

  async onModuleDestroy() {
    // ตัดการเชื่อมต่อเมื่อแอปปิด (Optional แต่แนะนำ)
    await this.$disconnect();
  }
}
