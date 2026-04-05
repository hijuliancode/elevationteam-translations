import path from 'path'
import fs from 'fs'
import { ITranslationConfig, ITranslationContent } from './types/types'
import { translateKeys } from './translate'
import { createProvider } from './providers'
import {
  createSnapshot,
  diffAgainstSnapshot,
  applyDiff,
  loadSnapshot,
  saveSnapshot,
} from './cache/snapshot'
import { getErrorMessage } from './errors'

export const configPath = path.join(process.cwd(), 'translations.config.js')

/**
 * Loads environment variables from a .env file without any external dependencies.
 * Shell environment variables always take precedence over .env values.
 * Exported for testing purposes.
 */
export function loadDotEnv(): void {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const rawVal = trimmed.slice(eqIndex + 1).trim()
    const value = rawVal.replace(/^(['"])(.*)\1$/, '$2') // strip surrounding quotes
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

type RawConfig = ITranslationConfig & { languages?: string[] }

function normalizeConfig(raw: RawConfig): ITranslationConfig {
  const normalized = { ...raw } as ITranslationConfig

  // Backward compat: 'languages' -> 'targetLanguages'
  if ('languages' in raw && !raw.targetLanguages) {
    console.warn(
      '[et-translations] DEPRECATION: "languages" in translations.config.js has been renamed to "targetLanguages". Please update your config.'
    )
    normalized.targetLanguages = (raw as RawConfig).languages as string[]
  }

  // Backward compat: no provider -> try OPENAI_API_KEY env var
  if (!raw.provider) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error(
        '[et-translations] Error: No "provider" in translations.config.js and OPENAI_API_KEY env var is not set.'
      )
      process.exit(1)
    }
    console.warn(
      '[et-translations] DEPRECATION: Using OPENAI_API_KEY from environment. Add a "provider" block to translations.config.js.'
    )
    normalized.provider = { type: 'openai', apiKey, model: 'gpt-3.5-turbo-0125' }
  }

  return normalized
}

/**
 * Validates that a resolved filesystem path stays within the project root.
 * Prevents path traversal via malicious inputDir/outputDir config values.
 */
function assertPathWithinCwd(resolvedPath: string): void {
  const cwd = process.cwd()
  const relative = path.relative(cwd, resolvedPath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    console.error(
      `[et-translations] Error: Path "${resolvedPath}" escapes the project directory. Check inputDir and outputDir in your config.`
    )
    process.exit(1)
  }
}

function parseJsonFile(filePath: string): ITranslationContent {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    console.error(`[et-translations] Error: Failed to parse JSON file at ${filePath}. Ensure it is valid JSON.`)
    process.exit(1)
  }
}

export async function loadConfig(): Promise<ITranslationConfig> {
  loadDotEnv() // Load .env before reading config so process.env['KEY'] references resolve
  try {
    if (!fs.existsSync(configPath)) {
      console.error('Error: translations.config.js not found.')
      process.exit(1)
    }
    const raw = (await import(configPath)).translationConfig as RawConfig
    return normalizeConfig(raw)
  } catch (error) {
    console.error('Error loading configuration:', getErrorMessage(error))
    process.exit(1)
  }
}

export async function processTranslations(config: ITranslationConfig): Promise<void> {
  const normalized = normalizeConfig(config as RawConfig)
  const { defaultLanguage, targetLanguages, inputDir, outputDir, cacheEnabled = true } = normalized

  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.json`)
  assertPathWithinCwd(baseFilePath)

  if (!fs.existsSync(baseFilePath)) {
    console.error(`[et-translations] Error: Base translation file not found at ${baseFilePath}`)
    process.exit(1)
  }

  const currentContent = parseJsonFile(baseFilePath)
  const snapshotPath = path.join(process.cwd(), inputDir, '.translations.cache.json')
  const priorSnapshot = cacheEnabled ? loadSnapshot(snapshotPath) : null
  const diff = diffAgainstSnapshot(currentContent, priorSnapshot)

  const hasChanges =
    Object.keys(diff.added).length > 0 ||
    Object.keys(diff.modified).length > 0 ||
    diff.deleted.length > 0

  if (!hasChanges) {
    console.log('[et-translations] Nothing changed, skipping translation.')
    return
  }

  const provider = createProvider(normalized.provider)

  try {
    for (const language of targetLanguages) {
      if (language === defaultLanguage) continue

      const targetFilePath = path.join(process.cwd(), outputDir, `${language}.json`)
      assertPathWithinCwd(targetFilePath)

      let existingTarget: ITranslationContent = {}
      if (fs.existsSync(targetFilePath)) {
        existingTarget = parseJsonFile(targetFilePath)
      }

      const keysToTranslate = { ...diff.added, ...diff.modified }
      const translated = Object.keys(keysToTranslate).length > 0
        ? await translateKeys(keysToTranslate, language, provider)
        : {}

      const pick = (keys: string[]) =>
        Object.fromEntries(keys.filter((k) => k in translated).map((k) => [k, translated[k]]))

      const result = applyDiff(
        existingTarget,
        diff,
        pick(Object.keys(diff.added)),
        pick(Object.keys(diff.modified))
      )

      fs.writeFileSync(targetFilePath, JSON.stringify(result, null, 2), 'utf-8')
      console.log(`[et-translations] Updated ${language} at ${targetFilePath}`)
    }

    if (cacheEnabled) {
      saveSnapshot(snapshotPath, createSnapshot(currentContent, defaultLanguage))
    }
  } catch (error) {
    console.error('[et-translations] Error processing translations:', getErrorMessage(error))
    process.exit(1)
  }
}
