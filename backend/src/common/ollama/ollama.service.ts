import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly ollamaUrl: string = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/embeddings';
    private readonly model: string = process.env.OLLAMA_MODEL || 'bge-m3';

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await axios.post(this.ollamaUrl, {
                model: this.model,
                prompt: text,
            });

            if (response.data && response.data.embedding) {
                return response.data.embedding;
            }

            throw new Error('No embedding returned from Ollama');
        } catch (error) {
            this.logger.error(`Failed to generate embedding: ${error.message}`);
            throw error;
        }
    }
}
