import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

export async function init() {
  console.log('Welcome to the Elevation Team Translation CLI!');

  let defaultLanguage = (await question('Enter the base locale (e.g., en) [default: en]: ')) || 'en';
  let inputDir = (await question('Enter the input directory for translation files (e.g., src/translations) [default: src/translations]: ')) || 'src/translations';
  let outputDir = (await question('Enter the output directory for generated translation files (e.g., src/translations) [default: src/translations]: ')) || 'src/translations';
  let format = (await question('Enter the output format (e.g., json, js) [default: json]: ')) || 'json';

  const localesInput = await question('Enter target locales separated by space or comma (e.g., fr, es, de): ');
  const languages = localesInput.split(/[\s,]+/).filter(locale => locale);

  const configPath = path.join(process.cwd(), 'translation.config.ts');

  // Check if the config file already exists
  if (fs.existsSync(configPath)) {
    console.log('Config file already exists at translation.config.ts');
    return;
  }

  const aiProvider = await question('¿Qué proveedor de IA desea usar para las traducciones? (openai): ');

  // Content for the configuration file
  const configContent = `
export const translationConfig = {
  defaultLanguage: '${defaultLanguage}', // Base language for translations
  languages: ['${defaultLanguage}', ${languages.map(locale => `'${locale}'`).join(', ')}], // Target languages for translations
  inputDir: '${inputDir}', // Directory for the base translation files
  outputDir: '${outputDir}', // Directory for the generated translation files
  format: '${format}', // Output format (e.g., json, js)
  aiProvider: '${aiProvider}', // AI provider for translations
};

`;

  // Create the configuration file
  fs.writeFileSync(configPath, configContent);
  console.log('Config file created successfully at translation.config.ts');

  // Check if package.json exists before modifying it
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found. Please ensure you are in a Node.js project.');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // Add translation scripts if they do not already exist
  packageJson.scripts = packageJson.scripts || {};

  // Add the "translation:watch" script to automatically watch for changes
  if (!packageJson.scripts['translation:watch']) {
    packageJson.scripts['translation:watch'] = '@elevationteam/translations watch';
    console.log('Script "translation:watch" added to package.json');
  } else {
    console.log('Script "translation:watch" already exists in package.json');
  }

  // Add the "translation:run" script to manually run translations
  if (!packageJson.scripts['translation:run']) {
    packageJson.scripts['translation:run'] = '@elevationteam/translations run';
    console.log('Script "translation:run" added to package.json');
  } else {
    console.log('Script "translation:run" already exists in package.json');
  }

  // Save changes to package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
