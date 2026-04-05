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
  console.log('Welcome to the ElevationTeam Translation CLI!')

  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found. Please ensure you are in a Node.js project.')
    process.exit(1)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  if (fs.existsSync(configPath)) {
    const overwrite = (await question('Config file already exists at translations.config.js, do you want to overwrite it?: (no) ')) || 'n'
    if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
      console.log('Exiting...')
      process.exit(0)
    }
    fs.unlinkSync(configPath)
  }

  const baseLanguage = (await question('Enter the base language: (en) ')) || 'en'
  const targetLanguagesInput = (await question('Enter target locales separated by space or comma: (es) ')) || 'es'
  const targetLanguages = targetLanguagesInput.split(/[\s,]+/).filter(Boolean)
  const inputDir = ((await question('Enter the input directory where the base file is located: (src/translations) ')) || 'src/translations').trim()
  const outputDir = ((await question('Enter the output directory for generated translation files: (src/translations) ')) || 'src/translations').trim()

  // Provider selection
  const rawProviderType = (await question('Which AI provider? openai / anthropic / ollama (openai) ')).trim().toLowerCase()
  const providerType = ['openai', 'anthropic', 'ollama'].includes(rawProviderType) ? rawProviderType : 'openai'

  let providerBlock: string

  if (providerType === 'ollama') {
    const baseUrl = ((await question('Ollama base URL: (http://localhost:11434) ')) || 'http://localhost:11434').trim()
    const model = ((await question('Ollama model: (llama3.2) ')) || 'llama3.2').trim()
    providerBlock = `{ type: 'ollama', baseUrl: '${baseUrl}', model: '${model}' }`
  } else if (providerType === 'anthropic') {
    const defaultVar = 'ANTHROPIC_API_KEY'
    const envVar = ((await question(`Environment variable for your Anthropic API key: (${defaultVar}) `)) || defaultVar).trim()
    const model = ((await question('Anthropic model: (claude-haiku-4-5-20251001) ')) || 'claude-haiku-4-5-20251001').trim()
    providerBlock = `{ type: 'anthropic', apiKey: process.env['${envVar}'], model: '${model}' }`
    console.log(`\n  Set your API key: export ${envVar}=<your-key>`)
  } else {
    const defaultVar = 'OPENAI_API_KEY'
    const envVar = ((await question(`Environment variable for your OpenAI API key: (${defaultVar}) `)) || defaultVar).trim()
    const model = ((await question('OpenAI model: (gpt-4o-mini) ')) || 'gpt-4o-mini').trim()
    providerBlock = `{ type: 'openai', apiKey: process.env['${envVar}'], model: '${model}' }`
    console.log(`\n  Set your API key: export ${envVar}=<your-key>`)
  }

  // O(n) deduplication using Set, filter out base language
  const formatLanguages = (languages: string[]) =>
    [...new Set(languages)]
      .filter((language) => language !== baseLanguage)
      .map((language) => `'${language}'`)

  const configContent = `export const translationConfig = {
  defaultLanguage: '${baseLanguage}',
  targetLanguages: [${formatLanguages(targetLanguages)}],
  inputDir: '${inputDir}',
  outputDir: '${outputDir}',
  provider: ${providerBlock},
}
`

  const confirm = (await question(`About to write to ${configPath}:\n${configContent}\nIs this OK? (yes) `)) || 'y'
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('Aborted.')
    process.exit(0)
  }

  fs.writeFileSync(configPath, configContent)

  // Determine the env var name for the summary block
  const envVarName = providerType === 'ollama'
    ? null
    : providerType === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'

  console.log('\n' + '─'.repeat(55))
  console.log('  Setup complete!\n')
  console.log(`  Config created at: translations.config.js`)

  if (envVarName) {
    console.log(`\n  Add your API key to your .env file:`)
    console.log(`    ${envVarName}=<your-key-here>`)
    console.log(`\n  The CLI reads .env automatically — no extra setup needed.`)
  }

  console.log(`\n  Add these lines to your .gitignore:`)
  console.log(`    .env`)
  console.log(`    ${inputDir}/.translations.cache.json`)

  console.log(`\n  Useful commands:`)
  console.log(`    et-translations run     → translate new/changed keys only`)
  console.log(`    et-translations watch   → auto-translate on file save`)
  console.log(`    et-translations check   → verify translation coverage`)
  console.log(`\n  Watch mode only monitors: ${inputDir}/${baseLanguage}.json`)
  console.log(`  It does NOT scan your source code — no unnecessary AI calls.`)
  console.log('─'.repeat(55) + '\n')

  packageJson.scripts = packageJson.scripts || {}

  if (!packageJson.scripts['translation:run']) {
    packageJson.scripts['translation:run'] = 'et-translations run'
    console.log('Script "translation:run" added to package.json')
  } else {
    console.log('Script "translation:run" already exists in package.json')
  }

  if (!packageJson.scripts['translation:watch']) {
    packageJson.scripts['translation:watch'] = 'et-translations watch'
    console.log('Script "translation:watch" added to package.json')
  } else {
    console.log('Script "translation:watch" already exists in package.json')
  }

  if (!packageJson.scripts['translation:check']) {
    packageJson.scripts['translation:check'] = 'et-translations check'
    console.log('Script "translation:check" added to package.json')
  } else {
    console.log('Script "translation:check" already exists in package.json')
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  rl.close()
}
