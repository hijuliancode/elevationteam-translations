import path from 'path';
import fs from 'fs';
import { processTranslations, loadDotEnv } from '../utils';
import { ITranslationConfig } from '../types/types';
import { translateKeys } from '../translate';
import { createProvider } from '../providers';

jest.mock('fs');
jest.mock('../translate');
jest.mock('../providers');

const mockTranslateKeys = translateKeys as jest.MockedFunction<typeof translateKeys>;
const mockCreateProvider = createProvider as jest.MockedFunction<typeof createProvider>;
const mockFs = fs as jest.Mocked<typeof fs>;

const baseConfig: ITranslationConfig = {
  defaultLanguage: 'en',
  targetLanguages: ['es'],
  inputDir: 'src/locales',
  outputDir: 'src/locales',
  provider: { type: 'openai', apiKey: 'key', model: 'gpt-4o-mini' },
};

const baseContent = { hello: 'Hello', goodbye: 'Goodbye' };

beforeEach(() => {
  jest.clearAllMocks();

  mockCreateProvider.mockReturnValue({ translate: jest.fn() });

  // Base file exists
  mockFs.existsSync.mockImplementation((p) => {
    const str = String(p);
    // snapshot does not exist (first run)
    if (str.includes('.translations.cache')) return false;
    // base file exists
    return true;
  });

  mockFs.readFileSync.mockImplementation((p) => {
    const str = String(p);
    if (str.includes('en.json')) return JSON.stringify(baseContent);
    if (str.includes('es.json')) return JSON.stringify({});
    return '';
  });

  mockFs.writeFileSync.mockImplementation(() => undefined);

  mockTranslateKeys.mockResolvedValue({ hello: 'Hola', goodbye: 'Adios' });
});

describe('loadDotEnv', () => {
  // Keys added during tests — cleaned up after each
  const addedKeys: string[] = [];

  afterEach(() => {
    addedKeys.forEach((key) => delete process.env[key]);
    addedKeys.length = 0;
    jest.clearAllMocks();
  });

  function trackKey(key: string): string {
    addedKeys.push(key);
    return key;
  }

  test('loads KEY=value pairs from .env file', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('MY_VAR=hello\nANOTHER_VAR=world');

    loadDotEnv();

    expect(process.env[trackKey('MY_VAR')]).toBe('hello');
    expect(process.env[trackKey('ANOTHER_VAR')]).toBe('world');
  });

  test('strips surrounding single and double quotes from values', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("KEY_SQ='my value'\nKEY_DQ=\"another value\"");

    loadDotEnv();

    expect(process.env[trackKey('KEY_SQ')]).toBe('my value');
    expect(process.env[trackKey('KEY_DQ')]).toBe('another value');
  });

  test('ignores lines starting with #', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('# this is a comment\nREAL_KEY=real');

    loadDotEnv();

    expect(process.env[trackKey('REAL_KEY')]).toBe('real');
  });

  test('ignores blank lines', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('\n\nVALID_KEY=ok\n\n');

    loadDotEnv();

    expect(process.env[trackKey('VALID_KEY')]).toBe('ok');
  });

  test('does NOT override existing shell env vars', () => {
    process.env['EXISTING_KEY'] = 'shell-value';
    trackKey('EXISTING_KEY');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('EXISTING_KEY=dotenv-value');

    loadDotEnv();

    expect(process.env['EXISTING_KEY']).toBe('shell-value');
  });

  test('does nothing when .env does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);

    expect(() => loadDotEnv()).not.toThrow();
    expect(mockFs.readFileSync).not.toHaveBeenCalled();
  });

  test('handles value containing = sign', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('DB_URL=postgres://user:pass@host/db?ssl=true');

    loadDotEnv();

    expect(process.env[trackKey('DB_URL')]).toBe('postgres://user:pass@host/db?ssl=true');
  });
});

describe('processTranslations', () => {
  test('writes translated file for each target language', async () => {
    await processTranslations(baseConfig);

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('es.json'),
      expect.any(String),
      'utf-8'
    );
  });

  test('calls translateKeys only with changed keys (all keys on first run)', async () => {
    await processTranslations(baseConfig);

    expect(mockTranslateKeys).toHaveBeenCalledWith(
      expect.objectContaining({ hello: 'Hello', goodbye: 'Goodbye' }),
      'es',
      expect.any(Object)
    );
  });

  test('skips all translation when nothing changed (snapshot matches)', async () => {
    const { createSnapshot } = jest.requireActual('../cache/snapshot') as typeof import('../cache/snapshot');
    const snapshot = createSnapshot(baseContent, 'en');

    mockFs.existsSync.mockImplementation((p) => {
      const str = String(p);
      if (str.includes('.translations.cache')) return true;
      return true;
    });
    mockFs.readFileSync.mockImplementation((p) => {
      const str = String(p);
      if (str.includes('.translations.cache')) return JSON.stringify(snapshot);
      if (str.includes('en.json')) return JSON.stringify(baseContent);
      if (str.includes('es.json')) return JSON.stringify({ hello: 'Hola' });
      return '';
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await processTranslations(baseConfig);
    consoleSpy.mockRestore();

    expect(mockTranslateKeys).not.toHaveBeenCalled();
  });

  test('accepts deprecated "languages" field via normalizeConfig', async () => {
    const oldConfig = {
      defaultLanguage: 'en',
      languages: ['es'],
      inputDir: 'src/locales',
      outputDir: 'src/locales',
      provider: { type: 'openai' as const, apiKey: 'key', model: 'gpt-4o-mini' },
    } as unknown as ITranslationConfig;

    await expect(processTranslations(oldConfig)).resolves.not.toThrow();
  });
});
