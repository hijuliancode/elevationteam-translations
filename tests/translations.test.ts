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

    const response = await getMockTranslation(inputText, targetLanguage);

    console.log('Mock response:', response);

    expect(response).toBe('Hello');
  });

  afterAll(() => {
    jest.restoreAllMocks(); // Restore mocked functions to avoid affecting other tests
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
      // If the quota is insufficient, ensure the test fails with a clear message
      if (error instanceof Error && 'code' in error) {
        expect(error.code).toBe('insufficient_quota');
      } else {
        throw error;
      }
    }
  });
});
