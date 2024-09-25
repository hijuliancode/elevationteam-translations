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

  // Check if package.json exists before modifying it
  const packageJsonPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found. Please ensure you are in a Node.js project.')
    process.exit(1)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  // Check if the config file already exists
  if (fs.existsSync(configPath)) {
    const overwrite = await question('Config file already exists at translations.config.js, do you want to overwrite it?: (no) ') || 'n'

    if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
      console.log('Exiting...')
      process.exit(0)
    }

    // Remove the existing config file
    fs.unlinkSync(configPath)
  }


  let baseLanguage = (await question('Enter the base language: (en) ')) || 'en'

  const targetLanguagesInput = await question('Enter target locales separated by space or comma: (es) ') || 'es'
  const targetLanguages = targetLanguagesInput.split(/[\s,]+/).filter(locale => locale)

  let inputDir = (await question('Enter the input directory when the baseFile is located: (src/translations) ')) || 'src/translations'
  let outputDir = (await question('Enter the output directory for generated translation files: (src/translations) ')) || 'src/translations'

  // format languages, delete base language from target languages and duplicate languages
  const formatLanguages = (languages: string[]) => {
    console.log('formatting languages...')
    return languages
      .filter((language, index) => language !== baseLanguage && languages.indexOf(language) === index)
      .map(language => `'${language}'`)
  }
  
  // Content for the configuration file
  const configContent = `
export const translationConfig = {
  defaultLanguage: '${baseLanguage}', // Base language for translations
  languages: [${formatLanguages(targetLanguages)}], // Target languages for translations
  inputDir: '${inputDir}', // Directory where is the base translation file
  outputDir: '${outputDir}', // Directory for the generated translation files
}

`

  // Ask the user if the configuration ok
  const confirm = await question(`About to write to ${configPath}:
${configContent}
Is this OK? (yes) `) || 'y'

  if (confirm.toLowerCase() !== 'y') {
    console.log('Aborted.')
    process.exit(0)
  }

  // Create the configuration file
  fs.writeFileSync(configPath, configContent)
  console.log('Config file created successfully at translations.config.js')

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
