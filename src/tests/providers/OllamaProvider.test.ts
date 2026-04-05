import { OllamaProvider } from '../../providers/OllamaProvider';

describe('OllamaProvider', () => {
  const provider = new OllamaProvider({
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  });

  afterEach(() => jest.restoreAllMocks());

  test('returns translated text from API response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Hola' }),
    } as Response);

    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hola');
  });

  test('trims whitespace from response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: '  Hola  ' }),
    } as Response);

    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hola');
  });

  test('sends POST to correct endpoint with model and prompt', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Hola' }),
    } as Response);

    await provider.translate('Hello', 'es');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"llama3.2"'),
      })
    );
  });

  test('throws when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(provider.translate('Hello', 'es')).rejects.toThrow('Ollama API error: 500');
  });

  test('falls back to original text when response is empty', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: '' }),
    } as Response);

    const result = await provider.translate('Hello', 'es');
    expect(result).toBe('Hello');
  });
});
