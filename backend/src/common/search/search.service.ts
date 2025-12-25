import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { OllamaService } from '../ai/ollama/ollama.service';

// Interface สำหรับ Map ผลลัพธ์จาก Raw Query
interface PostSearchResult {
    id: number;
    content: string;
    similarity: number;
}

@Injectable()
export class SearchService {
    constructor(
        private prisma: PrismaService,
        private ollamaService: OllamaService,
    ) { }

    async searchPosts(query: string, limit = 5) {
        // 1. แปลงข้อความค้นหา เป็น Vector
        const queryEmbedding = await this.ollamaService.generateEmbedding(query);

        // 2. จัด format vector string ให้ Postgres เข้าใจ '[0.1, 0.2, ...]'
        const vectorString = JSON.stringify(queryEmbedding);

        // 3. ยิง Raw Query
        // หมายเหตุ: การใช้ $queryRaw จะปลอดภัยจาก SQL Injection หากใช้ Template Literal ``
        const results = await this.prisma.$queryRaw<PostSearchResult[]>`
      SELECT 
        id, 
        content,
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "Post"
      WHERE 1 - (embedding <=> ${vectorString}::vector) > 0.3  -- กรองความเหมือนขั้นต่ำ (Optional)
      ORDER BY embedding <=> ${vectorString}::vector ASC
      LIMIT ${limit};
    `;

        // 4. แปลง BigInt (ถ้ามี) หรือจัดการ data ก่อน return
        return results;
    }
}
