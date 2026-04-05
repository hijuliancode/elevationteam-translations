import fs from 'fs'
import path from 'path'
import { ITranslationConfig, ITranslationContent } from './types/types'
import { flattenContent } from './cache/snapshot'
import { getErrorMessage } from './errors'

function readJsonFile(filePath: string): ITranslationContent {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return {}
  }
}

export async function check(config: ITranslationConfig): Promise<void> {
  const { defaultLanguage, targetLanguages, inputDir, outputDir } = config

  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.json`)

  if (!fs.existsSync(baseFilePath)) {
    console.error(`[et-translations] Error: Base translation file not found at ${baseFilePath}`)
    process.exit(1)
  }

  let baseContent: ITranslationContent
  try {
    baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'))
  } catch (error) {
    console.error(`[et-translations] Error: Failed to parse ${baseFilePath}: ${getErrorMessage(error)}`)
    process.exit(1)
  }

  const baseFlat = flattenContent(baseContent!)
  const totalKeys = Object.keys(baseFlat).length

  console.log(`[et-translations] Checking translation coverage...\n`)
  console.log(`Base: ${path.relative(process.cwd(), baseFilePath)}  (${totalKeys} keys)\n`)

  let hasIncomplete = false

  for (const language of targetLanguages) {
    if (language === defaultLanguage) continue

    const targetFilePath = path.join(process.cwd(), outputDir, `${language}.json`)

    let targetFlat: Record<string, string> = {}
    if (fs.existsSync(targetFilePath)) {
      targetFlat = flattenContent(readJsonFile(targetFilePath))
    }

    const missing = Object.keys(baseFlat).filter((k) => !(k in targetFlat))
    const covered = totalKeys - missing.length

    if (missing.length === 0) {
      console.log(`  ✓ ${language.padEnd(6)} — ${covered}/${totalKeys}  complete`)
    } else {
      hasIncomplete = true
      console.log(`  ✗ ${language.padEnd(6)} — ${covered}/${totalKeys}  missing ${missing.length} ${missing.length === 1 ? 'key' : 'keys'}:`)
      for (const key of missing) {
        console.log(`        · ${key}`)
      }
    }
  }

  if (hasIncomplete) {
    console.log(`\n[et-translations] Incomplete translations found. Run \`et-translations run\` to fill them.`)
    process.exit(1)
  } else {
    console.log(`\n[et-translations] All translations are complete.`)
  }
}
