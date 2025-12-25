import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly apiUrl: string;
    private readonly model: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.apiUrl = this.configService.get<string>('OLLAMA_API_URL') || 'http://localhost:11434/api/embeddings';
        this.model = this.configService.get<string>('OLLAMA_MODEL') || 'bge-m3';
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // ใช้ firstValueFrom เพื่อแปลง Observable เป็น Promise (Standard ของ NestJS Axios)
            const { data } = await firstValueFrom(
                this.httpService.post(this.apiUrl, {
                    model: this.model,
                    prompt: text,
                }),
            );
            return data.embedding;
        } catch (error) {
            this.logger.error(`Ollama Embedding Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to generate vector embedding');
        }
    }
}
