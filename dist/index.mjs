#!/usr/bin/env node
import t from"fs";import e from"path";import n from"readline";import{OpenAI as o}from"openai";import a from"dotenv";const s=n.createInterface({input:process.stdin,output:process.stdout});function r(t){return new Promise((e=>s.question(t,e)))}a.config();const i=new o({organization:"org-1e3b1b1b-1e3b-1e3b-1e3b-1e3b1e3b1e3b",apiKey:process.env.OPENAI_API_KEY,project:"proj-1e3b1b1b-1e3b-1e3b-1e3b-1e3b1e3b1e3b"});async function c(t,e){try{const n=await i.chat.completions.create({model:"gpt-3.5-turbo",messages:[{role:"system",content:"You are a helpful assistant that translates text."},{role:"user",content:`Translate the following text to ${e}: "${t}"`}],temperature:.5});return n.choices[0]?.message?.content?.trim()||""}catch(t){return console.error("Error translating text",t),""}}const[,,l]=process.argv;if("init"===l)!async function(){console.log("Welcome to the Elevation Team Translation CLI!");const n=await r("Enter the base locale (e.g., en): "),o=await r("Enter the input directory for translation files (e.g., src/translations): "),a=await r("Enter the output directory for generated translation files (e.g., src/translations): "),s=await r("Enter the output format (e.g., json, js): ");let i=[],c=!0;for(;c;){const t=await r("Enter a target locale (e.g., fr): ");i.push(t),c="y"===await r("Add another target locale? (y/n): ")}const l=e.join(process.cwd(),"translation.config.ts");if(t.existsSync(l))return void console.log("Config file already exists at translation.config.ts");const f=await r("¿Qué proveedor de IA desea usar para las traducciones? (openai): "),p=`\n    export const translationConfig = {\n      baseLocale: ${n}, // Base language for translations\n      languages: [\n        '${n}',\n        ${i.map((t=>`'${t}'`)).join(",\n  ")}\n      ], // Target languages for translations\n      inputDir: '${o}', // Directory for the base translation files\n      outputDir: '${a}', // Directory for the generated translation files\n      format: '${s}', // Output format (e.g., json, js)\n      aiProvider: '${f}', // AI provider for translations\n    };\n  `;t.writeFileSync(l,p),console.log("Config file created successfully at translation.config.ts");const g=e.join(process.cwd(),"package.json");if(!t.existsSync(g))return void console.error("Error: package.json not found. Please ensure you are in a Node.js project.");const u=JSON.parse(t.readFileSync(g,"utf-8"));u.scripts=u.scripts||{},u.scripts["translation:watch"]?console.log('Script "translation:watch" already exists in package.json'):(u.scripts["translation:watch"]="elevationteam-translation watch",console.log('Script "translation:watch" added to package.json')),u.scripts["translation:run"]?console.log('Script "translation:run" already exists in package.json'):(u.scripts["translation:run"]="elevationteam-translation run",console.log('Script "translation:run" added to package.json')),t.writeFileSync(g,JSON.stringify(u,null,2))}();else if("watch"===l){!async function(n){const{baseLocale:o,locales:a,inputDir:s,outputDir:r,format:i}=n,l=e.join(process.cwd(),s,`${o}.${i}`);t.existsSync(l)?(t.watch(l,(async n=>{if("change"===n){console.log(`Changes detected in ${l}`);try{const n=JSON.parse(t.readFileSync(l,"utf-8"));for(const s of a){if(s===o)continue;const a=e.join(process.cwd(),r,`${s}.${i}`);let l={};t.existsSync(a)&&(l=JSON.parse(t.readFileSync(a,"utf-8")));const f={...l};for(const[t,e]of Object.entries(n))l[t]&&l[t]===e||(f[t]=await c(e,s));t.writeFileSync(a,JSON.stringify(f,null,2)),console.log(`Translation updated for ${s} at ${a}`)}}catch(t){console.error(`Error processing translations: ${t.message}`)}}})),console.log(`Watching for changes in ${l}`)):console.error(`Base file not found: ${l}`)}(require(process.cwd()+"/translations.config.js").translationConfig)}else console.log('Unknown command. Use "init" or "watch".');
