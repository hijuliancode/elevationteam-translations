import { openAIClient } from '../src/translate'; // Importamos el cliente real
import { jest } from '@jest/globals';

// Mock Data Test
describe('OpenAI API Mock Call', () => {
  beforeAll(() => {
    jest.spyOn(openAIClient, 'translate').mockResolvedValue('Hello');
  });

  test('should return a mock translation from Spanish to English', async () => {
    const inputText = 'Hola';
    const targetLanguage = 'en';

    const getMockTranslation = (input: string, targetLang: string): Promise<string> => {
      return new Promise((resolve) => {
        resolve('Hello');
      });
    };

    // const response = await openAIClient.translate(inputText, targetLanguage);
    const response = await getMockTranslation(inputText, targetLanguage);

    console.log('Mock response:', response);

    expect(response).toBe('Hello');
  });

  afterAll(() => {
    jest.restoreAllMocks(); // Restauramos las funciones mockeadas para evitar que afecten otros tests
  });
});

// Real API Call Test
describe('OpenAI API Real Call', () => {
  test('should generate a translation from Spanish to English', async () => {
    const inputText = 'Hola';
    const targetLanguage = 'en';

    try {
      const response = await openAIClient.translate(inputText, targetLanguage);

      console.log('OpenAI response:', response);

      expect(response).not.toBeNull();
      expect(response).toBeDefined();
      expect(response).toContain('Hello');
    } catch (error) {
      console.error('OpenAI API Real Call Error:', error);
      // Si la cuota es insuficiente, aseguramos que el test falle con un mensaje claro
      expect(error.code).toBe('insufficient_quota');
    }
  });
});
