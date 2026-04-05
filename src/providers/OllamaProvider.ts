import { ITranslationProvider } from './ITranslationProvider';

export interface OllamaProviderConfig {
  baseUrl: string;
  model: string;
}

export class OllamaProvider implements ITranslationProvider {
  private config: OllamaProviderConfig;

  constructor(config: OllamaProviderConfig) {
    this.config = config;
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: `Translate the following text to ${targetLanguage}. Return only the translated text with no explanation:\n\n${text}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    return data.response?.trim() || text;
  }
}
