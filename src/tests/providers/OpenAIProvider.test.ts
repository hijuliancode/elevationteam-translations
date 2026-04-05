import { OpenAIProvider } from '../../providers/OpenAIProvider';
import { OpenAI } from 'openai';

jest.mock('openai');

const mockCreate = jest.fn();
(OpenAI as unknown as jest.Mock).mockImplementation(() => ({
  chat: { completions: { create: mockCreate } },
}));

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider({ apiKey: 'test-key', model: 'gpt-4o-mini' });

  afterEach(() => jest.clearAllMocks());

  test('returns translated text from API response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Hola' } }],
    });
    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hola');
  });

  test('trims whitespace from response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '  Hola  ' } }],
    });
    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hola');
  });

  test('falls back to original text when choices is empty', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] });
    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hello');
  });

  test('uses the configured model', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Hola' } }],
    });
    await provider.translate('Hello', 'es');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini' })
    );
  });

  test('throws when API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));
    await expect(provider.translate('Hello', 'es')).rejects.toThrow('API Error');
  });
});
