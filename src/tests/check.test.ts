import fs from 'fs';
import { check } from '../check';
import { ITranslationConfig } from '../types/types';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

const config: ITranslationConfig = {
  defaultLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  inputDir: 'src/locales',
  outputDir: 'src/locales',
  provider: { type: 'openai', apiKey: 'key', model: 'gpt-4o-mini' },
};

const baseContent = {
  greeting: 'Hello',
  farewell: 'Goodbye',
  menu: { home: 'Home', about: 'About' },
};

const completeEs = {
  greeting: 'Hola',
  farewell: 'Adiós',
  menu: { home: 'Inicio', about: 'Acerca de' },
};

const incompleteFr = {
  greeting: 'Bonjour',
  // farewell, menu.home, menu.about missing
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);

  mockFs.existsSync.mockImplementation((p) => {
    const str = String(p);
    if (str.includes('en.json')) return true;
    if (str.includes('es.json')) return true;
    if (str.includes('fr.json')) return true;
    return false;
  });

  mockFs.readFileSync.mockImplementation((p) => {
    const str = String(p);
    if (str.includes('en.json')) return JSON.stringify(baseContent);
    if (str.includes('es.json')) return JSON.stringify(completeEs);
    if (str.includes('fr.json')) return JSON.stringify(incompleteFr);
    return '';
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('check', () => {
  test('exits with code 0 when all languages are complete', async () => {
    // Both es and fr are complete for this test
    mockFs.readFileSync.mockImplementation((p) => {
      const str = String(p);
      if (str.includes('en.json')) return JSON.stringify(baseContent);
      return JSON.stringify(completeEs); // all targets complete
    });

    await check(config);

    expect(process.exit).not.toHaveBeenCalledWith(1);
  });

  test('exits with code 1 when a language has missing keys', async () => {
    await check(config);

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('reports missing keys for incomplete languages', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await check(config);

    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('fr');
    expect(output).toContain('farewell');
    consoleSpy.mockRestore();
  });

  test('treats missing target file as fully incomplete', async () => {
    mockFs.existsSync.mockImplementation((p) => {
      const str = String(p);
      if (str.includes('en.json')) return true;
      if (str.includes('es.json')) return true;
      if (str.includes('fr.json')) return false; // fr does not exist
      return false;
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await check(config);
    consoleSpy.mockRestore();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('reports complete languages positively', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await check(config);

    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('es');
    consoleSpy.mockRestore();
  });
});
