import { AnthropicProvider } from '../../providers/AnthropicProvider';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const mockCreate = jest.fn();
(Anthropic as unknown as jest.Mock).mockImplementation(() => ({
  messages: { create: mockCreate },
}));

describe('AnthropicProvider', () => {
  const provider = new AnthropicProvider({
    apiKey: 'test-key',
    model: 'claude-haiku-4-5-20251001',
  });

  afterEach(() => jest.clearAllMocks());

  test('returns translated text from API response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Hola' }],
    });
    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hola');
  });

  test('trims whitespace from response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '  Hola  ' }],
    });
    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hola');
  });

  test('falls back to original text when content is empty', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] });
    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hello');
  });

  test('uses the configured model', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Hola' }],
    });
    await provider.translate('Hello', 'es');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5-20251001' })
    );
  });

  test('throws when API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));
    await expect(provider.translate('Hello', 'es')).rejects.toThrow('API Error');
  });
});
