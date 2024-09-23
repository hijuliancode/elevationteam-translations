import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { configPath } from './utils'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

export async function init() {
  console.log('Welcome to the Elevation Team Translation CLI!')

  let baseLanguage = (await question('Enter the base language (en): ')) || 'en'
  const targetLanguagesInput = await question('Enter target locales separated by space or comma (es): ') || 'es'
  const targetLanguages = targetLanguagesInput.split(/[\s,]+/).filter(locale => locale)

  // Check if the default language is included in the target languages
  if (targetLanguages.includes(baseLanguage)) {
    console.log('Warning: The base language is included in the target languages. Removing it from the target languages...')
    // Remove the default language from the target languages
    targetLanguages.splice(targetLanguages.indexOf(baseLanguage), 1)
    return
  }

  // Check if the target languages are the same
  if (targetLanguages.length === 1 && targetLanguages[0] === baseLanguage) {
    console.log('Warning: The target language is the same as the base language. Please select a different target language.')
    return
  }

  let inputDir = (await question('Enter the input directory when the baseFile is located (src/translations): ')) || 'src/translations'
  let outputDir = (await question('Enter the output directory for generated translation files (src/translations): ')) || 'src/translations'
  let format = (await question('Enter the output format js or json (json): ')) || 'json'

  // Check if the config file already exists
  if (fs.existsSync(configPath)) {
    console.log('Config file already exists at translation.config.js')
    return
  }

  // const aiProvider = (await question('Which AI provider do you want to use for translations? (openai): ')) || 'openai'
  const aiProvider = 'openai' // TODO: Add support for multiple AI providers

  // Content for the configuration file
  const configContent = `
export const translationConfig = {
  defaultLanguage: '${baseLanguage}', // Base language for translations
  languages: ['${baseLanguage}', ${targetLanguages.map(locale => `'${locale}'`).join(', ')}], // Target languages for translations
  inputDir: '${inputDir}', // Directory for the base translation files
  outputDir: '${outputDir}', // Directory for the generated translation files
  format: '${format}', // Output format (e.g., json, js)
  aiProvider: '${aiProvider}', // AI provider for translations
}

`

  // Create the configuration file
  fs.writeFileSync(configPath, configContent)
  console.log('Config file created successfully at translation.config.js')

  // Check if package.json exists before modifying it
  const packageJsonPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found. Please ensure you are in a Node.js project.')
    return
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  // Add translation scripts if they do not already exist
  packageJson.scripts = packageJson.scripts || {}

  // Add the "translation:run" script to manually run translations
  if (!packageJson.scripts['translation:run']) {
    packageJson.scripts['translation:run'] = 'et-translations run'
    console.log('Script "translation:run" added to package.json')
  } else {
    console.log('Script "translation:run" already exists in package.json')
  }

  // Add the "translation:watch" script to automatically watch for changes
  if (!packageJson.scripts['translation:watch']) {
    packageJson.scripts['translation:watch'] = 'et-translations watch'
    console.log('Script "translation:watch" added to package.json')
  } else {
    console.log('Script "translation:watch" already exists in package.json')
  }

  // Save changes to package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  rl.close()
}
