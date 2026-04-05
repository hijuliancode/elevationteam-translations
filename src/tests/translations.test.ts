import { translateKeys } from '../translate';
import { ITranslationProvider } from '../providers/ITranslationProvider';

function makeMockProvider(responseMap: Record<string, string>): ITranslationProvider {
  return {
    translate: jest.fn().mockImplementation((text: string) =>
      Promise.resolve(responseMap[text] ?? text)
    ),
  };
}

describe('Translation Tests', () => {
  afterEach(() => jest.clearAllMocks());

  test('should translate a simple string', async () => {
    const provider = makeMockProvider({ 'Hello': 'Hola' });
    const result = await translateKeys({ greeting: 'Hello' }, 'es', provider);
    expect(result['greeting']).toBe('Hola');
  });

  test('should translate all keys in a flat record', async () => {
    const provider = makeMockProvider({ 'Home': 'Inicio', 'About': 'Acerca de' });
    const result = await translateKeys({ home: 'Home', about: 'About' }, 'es', provider);
    expect(result['home']).toBe('Inicio');
    expect(result['about']).toBe('Acerca de');
  });

  test('should handle API errors gracefully, returning original text', async () => {
    const provider: ITranslationProvider = {
      translate: jest.fn().mockRejectedValue(new Error('API Error')),
    };
    const result = await translateKeys({ greeting: 'Hello' }, 'es', provider);
    expect(result['greeting']).toBe('Hello');
  });

  test('should return empty object for empty input', async () => {
    const provider = makeMockProvider({});
    const result = await translateKeys({}, 'es', provider);
    expect(result).toEqual({});
    expect(provider.translate).not.toHaveBeenCalled();
  });

  test('should pass the correct target language to provider', async () => {
    const provider = makeMockProvider({});
    (provider.translate as jest.Mock).mockResolvedValue('Bonjour');
    await translateKeys({ greeting: 'Hello' }, 'fr', provider);
    expect(provider.translate).toHaveBeenCalledWith('Hello', 'fr');
  });

  test('should fall back to original text when provider returns empty string', async () => {
    const provider: ITranslationProvider = {
      translate: jest.fn().mockResolvedValue(''),
    };
    const result = await translateKeys({ greeting: 'Hello' }, 'es', provider);
    expect(result['greeting']).toBe('Hello');
  });
});
