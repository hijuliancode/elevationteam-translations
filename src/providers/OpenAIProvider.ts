import { OpenAI } from 'openai';
import { ITranslationProvider } from './ITranslationProvider';

export interface OpenAIProviderConfig {
  apiKey: string;
  model: string;
}

export class OpenAIProvider implements ITranslationProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Return only the translated text with no explanation.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });
    return response.choices[0]?.message?.content?.trim() ?? text;
  }
}
