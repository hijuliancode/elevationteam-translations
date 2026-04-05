import { ITranslationProvider } from './providers/ITranslationProvider';
import { getErrorMessage } from './errors';

/**
 * Translates a flat Record<dotKey, sourceText> using the given provider.
 * Returns a Record<dotKey, translatedText>.
 * Falls back to the original text if the provider throws or returns an empty string.
 */
export async function translateKeys(
  keys: Record<string, string>,
  targetLanguage: string,
  provider: ITranslationProvider
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(keys)) {
    try {
      const translated = await provider.translate(value, targetLanguage);
      result[key] = translated || value; // Fallback if provider returns empty string
    } catch (error) {
      console.error(`Error translating key "${key}" to ${targetLanguage}: ${getErrorMessage(error)}`);
      result[key] = value;
    }
  }

  return result;
}
