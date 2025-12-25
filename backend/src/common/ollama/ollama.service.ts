import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    // Default to localhost, configurable via env
    private readonly ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    private readonly model = 'bge-m3';

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Flexible URL handling: if user provided full path in env, use it; otherwise append endpoint
            const url = this.ollamaUrl.endsWith('/api/embeddings')
                ? this.ollamaUrl
                : `${this.ollamaUrl}/api/embeddings`;

            const response = await axios.post(url, {
                model: this.model,
                prompt: text,
            });

            if (response.data && response.data.embedding) {
                return response.data.embedding;
            }

            throw new Error('No embedding returned from Ollama');
        } catch (error) {
            this.logger.error(`Failed to generate embedding: ${error.message}`);
            // In case of error, returning empty array or throwing?
            // Throwing ensures we don't save bad data.
            throw error;
        }
    }
}
