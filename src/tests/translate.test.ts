import { translateKeys } from '../translate';
import { ITranslationProvider } from '../providers/ITranslationProvider';

function makeMockProvider(translateFn: jest.Mock): ITranslationProvider {
  return { translate: translateFn };
}

describe('translateKeys', () => {
  afterEach(() => jest.clearAllMocks());

  test('translates each key using the provider', async () => {
    const mockTranslate = jest.fn().mockResolvedValue('Hola');
    const provider = makeMockProvider(mockTranslate);

    const result = await translateKeys({ hello: 'Hello', world: 'World' }, 'es', provider);

    expect(result).toEqual({ hello: 'Hola', world: 'Hola' });
    expect(mockTranslate).toHaveBeenCalledTimes(2);
  });

  test('returns original text when provider throws', async () => {
    const mockTranslate = jest.fn().mockRejectedValue(new Error('API fail'));
    const provider = makeMockProvider(mockTranslate);

    const result = await translateKeys({ hello: 'Hello' }, 'es', provider);

    expect(result['hello']).toBe('Hello');
  });

  test('returns empty object for empty input', async () => {
    const mockTranslate = jest.fn();
    const provider = makeMockProvider(mockTranslate);

    const result = await translateKeys({}, 'es', provider);

    expect(result).toEqual({});
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  test('falls back to original text when provider returns empty string', async () => {
    const mockTranslate = jest.fn().mockResolvedValue('');
    const provider = makeMockProvider(mockTranslate);

    const result = await translateKeys({ greeting: 'Hello' }, 'es', provider);

    expect(result['greeting']).toBe('Hello');
  });

  test('passes targetLanguage to provider.translate', async () => {
    const mockTranslate = jest.fn().mockResolvedValue('Bonjour');
    const provider = makeMockProvider(mockTranslate);

    await translateKeys({ hello: 'Hello' }, 'fr', provider);

    expect(mockTranslate).toHaveBeenCalledWith('Hello', 'fr');
  });
});
