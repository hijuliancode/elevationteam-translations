import Anthropic from '@anthropic-ai/sdk';
import { ITranslationProvider } from './ITranslationProvider';

export interface AnthropicProviderConfig {
  apiKey: string;
  model: string;
}

export class AnthropicProvider implements ITranslationProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: AnthropicProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Return only the translated text with no explanation.\n\n${text}`,
        },
      ],
    });
    const block = response.content[0];
    if (block?.type === 'text') {
      return block.text.trim() || text;
    }
    return text;
  }
}
