import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;
  private readonly embeddingModel: string;
  private readonly chatModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
    this.embeddingModel =
      this.configService.get<string>('GEMINI_EMBEDDING_MODEL') ||
      'gemini-embedding-001';
    this.chatModel =
      this.configService.get<string>('GEMINI_CHAT_MODEL') || 'gemini-2.0-flash';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: text,
      });
      const values = response.embeddings?.[0]?.values;
      if (!values) throw new Error('No embedding returned');
      return values;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Gemini Embedding Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(
        'Failed to generate vector embedding',
      );
    }
  }

  async interpretSearchQuery(query: string): Promise<any> {
    const prompt = `
You are a search intent interpreter for a marketplace application.
Analyze the user's search query and extract structured filters.

User Query: "${query}"

Rules:
1. keyword: Extract the main product or topic (remove qualitative adjectives).
2. minRating: If user asks for "reliable", "trustworthy", "good seller", "น่าเชื่อถือ", "ดี", set to 4. Otherwise null.
3. sortBy:
   - "PRICE_ASC" if user says "cheap", "budget", "low price", "ถูก", "ราคาถูก".
   - "PRICE_DESC" if user says "expensive", "premium", "แพง", "พรีเมียม".
   - null otherwise.

Output strictly valid JSON only:
{
  "keyword": string,
  "minRating": number | null,
  "sortBy": "PRICE_ASC" | "PRICE_DESC" | null
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.chatModel,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return JSON.parse(response.text ?? '{}');
    } catch (error) {
      this.logger.warn(
        `Failed to interpret query: ${(error as Error).message}. Falling back to basic search.`,
      );
      return { keyword: query };
    }
  }
}
