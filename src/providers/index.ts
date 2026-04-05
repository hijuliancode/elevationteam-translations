import { IProviderConfig } from '../types/types';
import { ITranslationProvider } from './ITranslationProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OllamaProvider } from './OllamaProvider';

export function createProvider(config: IProviderConfig): ITranslationProvider {
  if (config.type === 'openai') {
    return new OpenAIProvider({ apiKey: config.apiKey, model: config.model });
  }
  if (config.type === 'anthropic') {
    return new AnthropicProvider({ apiKey: config.apiKey, model: config.model });
  }
  if (config.type === 'ollama') {
    return new OllamaProvider({ baseUrl: config.baseUrl, model: config.model });
  }
  const exhaustive: never = config;
  throw new Error(`Unknown provider type: ${(exhaustive as IProviderConfig).type}`);
}
