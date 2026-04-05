# @elevationteam/translations

AI-powered CLI for automatic JSON i18n translation. Works with any framework — React, Vue, Angular, Svelte, Next.js, React Native, Node.js. Only translates keys that actually changed, keeping API costs minimal.

---

## Features

- **Smart change detection** — diffs your base file against a local cache; only sends new or modified keys to the AI
- **3 AI providers** — OpenAI, Anthropic (Claude), or Ollama for fully local translation
- **Auto-loads `.env`** — reads your API key from `.env` automatically, no extra config needed
- **Watch mode** — re-translates on file save, monitors *only* your base translation file
- **`check` command** — reports missing keys per language, exits with code 1 for CI pipelines
- **Nested JSON** — handles deeply nested translation objects
- **Framework agnostic** — works anywhere you have JSON i18n files

---

## Installation

```bash
npm install --save-dev @elevationteam/translations
# or
pnpm add -D @elevationteam/translations
# or
yarn add -D @elevationteam/translations
```

---

## Quick Start

### 1. Initialize

```bash
npx et-translations init
```

The wizard prompts for:
- Base language (e.g. `en`)
- Target languages (e.g. `es fr de`)
- Input directory — where your base JSON file lives
- Output directory — where translated files are written
- AI provider and model

It generates `translations.config.js` and adds scripts to your `package.json`.

### 2. Set your API key

Add your key to a `.env` file in your project root — the CLI reads it automatically:

```bash
# .env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

No extra dotenv setup needed. Shell environment variables always take precedence over `.env`.

> For **Ollama** (local): no API key required — just make sure Ollama is running.

### 3. Update `.gitignore`

```gitignore
.env
src/translations/.translations.cache.json
```

Replace `src/translations` with your actual `inputDir`. The cache file is a build artifact — commit it only if you want to skip first-run full translation on CI.

### 4. Translate

```bash
# One-time run — only translates new or changed keys
npm run translation:run

# Check for missing translations
npm run translation:check

# Watch mode — re-translates on file save
npm run translation:watch
```

---

## Configuration

`translations.config.js` lives at your project root. It's a regular JS module — `process.env` references are resolved at runtime from your environment or `.env` file.

### Full example

```js
// translations.config.js
export const translationConfig = {
  defaultLanguage: 'en',
  targetLanguages: ['es', 'fr', 'de', 'pt'],
  inputDir: 'src/locales',    // directory containing en.json
  outputDir: 'src/locales',   // where es.json, fr.json, etc. are written

  // ── Choose ONE provider ──────────────────────────────────

  // OpenAI
  provider: {
    type: 'openai',
    apiKey: process.env['OPENAI_API_KEY'],
    model: 'gpt-4o-mini',    // or 'gpt-4o', 'gpt-3.5-turbo'
  },

  // Anthropic (Claude)
  // provider: {
  //   type: 'anthropic',
  //   apiKey: process.env['ANTHROPIC_API_KEY'],
  //   model: 'claude-haiku-4-5-20251001',
  // },

  // Ollama (fully local, no API key)
  // provider: {
  //   type: 'ollama',
  //   baseUrl: 'http://localhost:11434',
  //   model: 'llama3.2',
  // },
}
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultLanguage` | `string` | — | Language code of your source file (e.g. `'en'`) |
| `targetLanguages` | `string[]` | — | Language codes to translate into |
| `inputDir` | `string` | — | Directory containing `{defaultLanguage}.json` |
| `outputDir` | `string` | — | Directory where translated files are written |
| `provider` | object | — | AI provider config (see below) |
| `cacheEnabled` | `boolean` | `true` | Set `false` to force full re-translation every run |

### Provider options

**OpenAI**

| Field | Description |
|---|---|
| `type` | `'openai'` |
| `apiKey` | `process.env['OPENAI_API_KEY']` |
| `model` | `'gpt-4o-mini'`, `'gpt-4o'`, `'gpt-3.5-turbo'` |

**Anthropic**

| Field | Description |
|---|---|
| `type` | `'anthropic'` |
| `apiKey` | `process.env['ANTHROPIC_API_KEY']` |
| `model` | `'claude-haiku-4-5-20251001'`, `'claude-sonnet-4-6'` |

**Ollama (local)**

| Field | Description |
|---|---|
| `type` | `'ollama'` |
| `baseUrl` | `'http://localhost:11434'` |
| `model` | `'llama3.2'`, `'gemma2'`, `'mistral'` |

---

## CLI Commands

```
et-translations init     Interactive setup — creates translations.config.js
et-translations run      Translate new/modified keys and exit
et-translations watch    Watch base file and auto-translate on change
et-translations check    Report missing keys per language (exits 1 if incomplete)
```

---

## `check` command

Verifies that every key in your base file exists in all target language files. No AI calls — pure file comparison.

```bash
npx et-translations check
```

**Example output:**

```
[et-translations] Checking translation coverage...

Base: src/locales/en.json  (8 keys)

  ✓ es     — 8/8  complete
  ✗ fr     — 5/8  missing 3 keys:
        · menu.dashboard
        · settings.privacy.title
        · footer.copyright
  ✗ de     — 7/8  missing 1 key:
        · footer.copyright

[et-translations] Incomplete translations found. Run `et-translations run` to fill them.
```

**Exit codes:** `0` = complete, `1` = missing keys.

**CI usage:**

```yaml
# GitHub Actions example
- name: Check translations
  run: npx et-translations check
```

---

## How change detection works

On first run all keys are translated. A `.translations.cache.json` snapshot is saved next to your base file.

On every subsequent run:
| Key state | Action |
|---|---|
| **Added** | Translated and inserted into target files |
| **Modified** | Re-translated and updated in target files |
| **Deleted** | Removed from all target files |
| **Unchanged** | Skipped — no AI call, original translation preserved |

If nothing changed, the tool exits immediately with no API calls.

---

## Watch mode

Watch mode monitors **only** `{inputDir}/{defaultLanguage}.json` — a single file. It does not scan your source code, components, or any other files. Changes to target files (`es.json`, `fr.json`, etc.) do not trigger a re-run.

```
[et-translations] Watching: src/locales/en.json
[et-translations] Only new or modified keys will be sent to the AI provider.
[et-translations] Source code and other files are NOT monitored.
```

Stop with `Ctrl+C`.

---

## File structure

```
src/locales/
  en.json                         ← your base file (you write this)
  es.json                         ← managed by et-translations
  fr.json                         ← managed by et-translations
  .translations.cache.json        ← cache (add to .gitignore)
```

### Base file (`en.json`)

```json
{
  "greeting": "Hello",
  "farewell": "Goodbye",
  "menu": {
    "home": "Home",
    "about": "About"
  }
}
```

After `et-translations run`, `es.json` becomes:

```json
{
  "greeting": "Hola",
  "farewell": "Adiós",
  "menu": {
    "home": "Inicio",
    "about": "Acerca de"
  }
}
```

---

## Monorepo usage

Point `inputDir` / `outputDir` to any subdirectory:

```js
export const translationConfig = {
  defaultLanguage: 'en',
  targetLanguages: ['es'],
  inputDir: 'packages/app/src/locales',
  outputDir: 'packages/app/src/locales',
  provider: { type: 'openai', apiKey: process.env['OPENAI_API_KEY'], model: 'gpt-4o-mini' },
}
```

---

## Using Ollama (fully local)

1. Install: [ollama.com/download](https://ollama.com/download)
2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. Configure:
   ```js
   provider: { type: 'ollama', baseUrl: 'http://localhost:11434', model: 'llama3.2' }
   ```
4. Run (no API key needed):
   ```bash
   npx et-translations run
   ```

> Requires Node.js 18+ (uses native `fetch`).

---

## Security

- **API keys are never stored in config files.** The config references `process.env['YOUR_KEY']`, read at runtime.
- **`.env` is loaded automatically** and takes lower precedence than shell variables.
- **Path traversal protection.** `inputDir` and `outputDir` are validated to stay inside your project root.
- **Cache file is not sensitive.** It stores SHA-256 hashes of source text for change detection — never API keys or translated content.

---

## Migrating from v0.1.x

Two changes needed in your existing `translations.config.js`:

```js
// Before
{
  languages: ['es', 'fr'],     // old field name
  // no provider — used OPENAI_API_KEY env var implicitly
}

// After
{
  targetLanguages: ['es', 'fr'],
  provider: {
    type: 'openai',
    apiKey: process.env['OPENAI_API_KEY'],
    model: 'gpt-4o-mini',
  },
}
```

Old configs continue to work with deprecation warnings until the next major version.

---

## FAQ

**Does it re-translate everything every time?**
No. Only keys that are new or have changed since the last run are sent to the AI. Unchanged keys are skipped entirely.

**Does watch mode scan my entire project?**
No. It monitors only `{inputDir}/{defaultLanguage}.json`. No source code, components, or other files are ever read.

**Is it framework agnostic?**
Yes. It only needs JSON files. Works with React, Vue, Angular, Svelte, Next.js, React Native, Remix, Astro, Nuxt, Node.js — anything that uses JSON for i18n.

**Can I use it in CI?**
Yes. Use `et-translations check` to fail the pipeline if translations are incomplete (exits with code 1).

**Can I override translations manually?**
Yes. If you edit a translated key directly in `es.json`, it will be preserved on future runs as long as the corresponding key in the base file hasn't changed.

---

## License

ISC © [hijuliancode](https://github.com/hijuliancode)
