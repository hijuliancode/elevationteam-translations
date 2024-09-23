import { translateContent } from '../src/translate';
import { BaseContent } from '../types/types';
import { OpenAI } from 'openai';

jest.mock('openai'); // Mockea el módulo OpenAI para evitar llamadas reales a la API

describe('Translation Tests', () => {
  const mockOpenAIResponse = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: { content: 'Hello' }
            }
          ]
        })
      }
    }
  };

  const baseContent: BaseContent = {
    greeting: 'Hola',
    farewell: 'Adiós',
    nested: {
      question: '¿Cómo estás?',
    },
  };

  const existingTranslations: BaseContent = {
    greeting: 'Hello',
  };

  beforeAll(() => {
    // Simula el cliente de OpenAI usando el mock anterior
    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIResponse);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpia los mocks después de cada test
  });

  test('should translate a simple string', async () => {
    const result = await translateContent(baseContent, {}, 'en');
    
    expect(result.greeting).toBe('Hello'); // Traducción simulada
    expect(result.farewell).toBe('Hello'); // Traducción simulada para otra palabra
  });

  test('should handle nested objects', async () => {
    const result = await translateContent(baseContent, {}, 'en');
    
    expect((result.nested as BaseContent).question).toBe('Hello'); // Traducción simulada del texto anidado
  });

  test('should not overwrite existing translations', async () => {
    const result = await translateContent(baseContent, existingTranslations, 'en');
    
    expect(result.greeting).toBe('Hello'); // Mantiene la traducción existente
    expect(result.farewell).toBe('Hello'); // Traducción simulada para el nuevo texto
  });

  test('should handle API errors gracefully', async () => {
    // Simula un error en la API de OpenAI
    mockOpenAIResponse.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

    const result = await translateContent(baseContent, {}, 'en');

    expect(result.greeting).toBe('Hola'); // No traduce en caso de error
  });

  test('should handle empty response from API', async () => {
    // Simula una respuesta vacía de la API
    mockOpenAIResponse.chat.completions.create.mockResolvedValueOnce({
      choices: []
    });

    const result = await translateContent(baseContent, {}, 'en');
    
    expect(result.greeting).toBe('Hola'); // Mantiene el valor original si la respuesta está vacía
  });

  test('should handle unexpected API response structure', async () => {
    // Simula una estructura de respuesta inesperada
    mockOpenAIResponse.chat.completions.create.mockResolvedValueOnce({
      unexpectedKey: 'unexpectedValue'
    });

    const result = await translateContent(baseContent, {}, 'en');
    
    expect(result.greeting).toBe('Hola'); // No cambia la traducción si la estructura es inesperada
  });
});
