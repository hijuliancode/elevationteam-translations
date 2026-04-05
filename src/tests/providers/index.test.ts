import { createProvider } from '../../providers';
import { OpenAIProvider } from '../../providers/OpenAIProvider';
import { AnthropicProvider } from '../../providers/AnthropicProvider';
import { OllamaProvider } from '../../providers/OllamaProvider';

jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('createProvider', () => {
  test('creates OpenAIProvider for type openai', () => {
    const provider = createProvider({ type: 'openai', apiKey: 'key', model: 'gpt-4o-mini' });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  test('creates AnthropicProvider for type anthropic', () => {
    const provider = createProvider({ type: 'anthropic', apiKey: 'key', model: 'claude-haiku-4-5-20251001' });
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  test('creates OllamaProvider for type ollama', () => {
    const provider = createProvider({ type: 'ollama', baseUrl: 'http://localhost:11434', model: 'llama3.2' });
    expect(provider).toBeInstanceOf(OllamaProvider);
  });
});
