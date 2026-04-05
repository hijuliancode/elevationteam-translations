import { flattenContent, diffAgainstSnapshot, applyDiff, createSnapshot } from '../../cache/snapshot';
import { ITranslationContent, ISnapshot } from '../../types/types';

describe('flattenContent', () => {
  test('flattens a simple object to dot-notation', () => {
    const content: ITranslationContent = {
      hello: 'Hello',
      goodbye: 'Goodbye',
    };
    expect(flattenContent(content)).toEqual({
      hello: 'Hello',
      goodbye: 'Goodbye',
    });
  });

  test('flattens nested objects using dot-notation', () => {
    const content: ITranslationContent = {
      menu: { home: 'Home', about: 'About' },
      footer: { privacy: 'Privacy' },
    };
    expect(flattenContent(content)).toEqual({
      'menu.home': 'Home',
      'menu.about': 'About',
      'footer.privacy': 'Privacy',
    });
  });

  test('handles deeply nested objects', () => {
    const content: ITranslationContent = {
      a: { b: { c: 'deep' } },
    };
    expect(flattenContent(content)).toEqual({ 'a.b.c': 'deep' });
  });

  test('returns empty object for empty input', () => {
    expect(flattenContent({})).toEqual({});
  });
});

describe('diffAgainstSnapshot', () => {
  const baseContent: ITranslationContent = {
    hello: 'Hello',
    goodbye: 'Goodbye',
    menu: { home: 'Home' },
  };

  test('marks all keys as added when snapshot is null', () => {
    const diff = diffAgainstSnapshot(baseContent, null);
    expect(diff.added).toEqual({
      hello: 'Hello',
      goodbye: 'Goodbye',
      'menu.home': 'Home',
    });
    expect(diff.modified).toEqual({});
    expect(diff.deleted).toEqual([]);
    expect(diff.unchanged).toEqual({});
  });

  test('detects added keys', () => {
    const snapshot = createSnapshot({ hello: 'Hello' }, 'en');
    const diff = diffAgainstSnapshot({ hello: 'Hello', newKey: 'New' }, snapshot);
    expect(diff.added).toEqual({ newKey: 'New' });
    expect(diff.unchanged['hello']).toBe('Hello');
  });

  test('detects modified keys', () => {
    const snapshot = createSnapshot({ hello: 'Hello' }, 'en');
    const diff = diffAgainstSnapshot({ hello: 'Hello changed' }, snapshot);
    expect(diff.modified).toEqual({ hello: 'Hello changed' });
    expect(diff.added).toEqual({});
  });

  test('detects deleted keys', () => {
    const snapshot = createSnapshot({ hello: 'Hello', removed: 'Gone' }, 'en');
    const diff = diffAgainstSnapshot({ hello: 'Hello' }, snapshot);
    expect(diff.deleted).toContain('removed');
    expect(diff.unchanged['hello']).toBe('Hello');
  });

  test('classifies unchanged keys correctly', () => {
    const snapshot = createSnapshot({ hello: 'Hello', world: 'World' }, 'en');
    const diff = diffAgainstSnapshot({ hello: 'Hello', world: 'World' }, snapshot);
    expect(diff.unchanged).toEqual({ hello: 'Hello', world: 'World' });
    expect(diff.added).toEqual({});
    expect(diff.modified).toEqual({});
    expect(diff.deleted).toEqual([]);
  });
});

describe('applyDiff', () => {
  const existingTarget: ITranslationContent = {
    hello: 'Hola',
    goodbye: 'Adios',
    menu: { home: 'Inicio' },
  };

  test('applies added keys without touching existing ones', () => {
    const result = applyDiff(
      existingTarget,
      { added: { newKey: 'New' }, modified: {}, deleted: [], unchanged: {} },
      { newKey: 'Nuevo' },
      {}
    );
    expect(result['newKey']).toBe('Nuevo');
    expect(result['hello']).toBe('Hola');
    expect(result['goodbye']).toBe('Adios');
  });

  test('applies modified keys', () => {
    const result = applyDiff(
      existingTarget,
      { added: {}, modified: { hello: 'Hello updated' }, deleted: [], unchanged: {} },
      {},
      { hello: 'Hola actualizado' }
    );
    expect(result['hello']).toBe('Hola actualizado');
    expect(result['goodbye']).toBe('Adios');
  });

  test('removes deleted keys from target', () => {
    const result = applyDiff(
      existingTarget,
      { added: {}, modified: {}, deleted: ['goodbye'], unchanged: {} },
      {},
      {}
    );
    expect(result['goodbye']).toBeUndefined();
    expect(result['hello']).toBe('Hola');
  });

  test('handles nested dot-notation paths for additions', () => {
    const result = applyDiff(
      existingTarget,
      { added: { 'menu.about': 'About' }, modified: {}, deleted: [], unchanged: {} },
      { 'menu.about': 'Acerca de' },
      {}
    );
    expect((result['menu'] as ITranslationContent)['about']).toBe('Acerca de');
    expect((result['menu'] as ITranslationContent)['home']).toBe('Inicio');
  });

  test('does not mutate the original existingTarget', () => {
    const original = { hello: 'Hola' };
    applyDiff(
      original,
      { added: { newKey: 'New' }, modified: {}, deleted: [], unchanged: {} },
      { newKey: 'Nuevo' },
      {}
    );
    expect(original).toEqual({ hello: 'Hola' });
  });
});
