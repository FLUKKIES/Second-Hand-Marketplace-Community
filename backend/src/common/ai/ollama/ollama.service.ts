import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly apiUrl: string;
    private readonly model: string;

    private readonly baseUrl: string;
    private readonly chatModel: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const apiUrl = this.configService.get<string>('OLLAMA_API_URL') || 'http://localhost:11434/api/embeddings';
        this.apiUrl = apiUrl;
        // Derive Base URL (remove /api/embeddings or /api/generate)
        this.baseUrl = apiUrl.replace(/\/api\/embeddings\/?$/, '').replace(/\/api\/generate\/?$/, '');

        this.model = this.configService.get<string>('OLLAMA_MODEL') || 'bge-m3';
        this.chatModel = this.configService.get<string>('OLLAMA_CHAT_MODEL') || 'llama3.2';
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
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

    async interpretSearchQuery(query: string): Promise<any> {
        const prompt = `
            You are a search intent interpreter for a marketplace application. 
            Analyze the user's search query and extract structured filters.

            User Query: "${query}"

            Rules:
            1. keyword: Extract the main product or topic (remove qualitative adjectives).
            2. minRating: If user asks for "reliable", "trustworthy", "good seller", set to 4. Otherwise null.
            3. sortBy: 
            - "PRICE_ASC" if user says "cheap", "budget", "low price".
            - "PRICE_DESC" if user says "expensive", "premium".
            - null otherwise.
            4. detectedType:
            - "SELLING" if user wants to buy/shop (e.g., "buy", "price", "second hand", "deal").
            - "NORMAL" if user wants reviews, opinions, or general talk (e.g., "review", "is it good?", "help").
            - "MIXED" if unclear.

            Output strictly valid JSON only:
            {
                "keyword": string,
                "minRating": number | null,
                "sortBy": "PRICE_ASC" | "PRICE_DESC" | null,
                "detectedType": "SELLING" | "NORMAL" | "MIXED"
            }
        `;

        try {
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.baseUrl}/api/generate`, {
                    model: this.chatModel,
                    prompt: prompt,
                    stream: false,
                    format: "json"
                }),
            );

            if (data.response) {
                return JSON.parse(data.response);
            }
            return { keyword: query, detectedType: 'MIXED' };
        } catch (error) {
            this.logger.warn(`Failed to interpret query: ${error.message}. Falling back to basic search.`);
            return { keyword: query, detectedType: 'MIXED' };
        }
    }
}
