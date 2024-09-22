#!/usr/bin/env node
import e from"fs";import t from"path";import n from"readline";import{OpenAI as o}from"openai";import s from"dotenv";const a=n.createInterface({input:process.stdin,output:process.stdout});function r(e){return new Promise((t=>a.question(e,t)))}s.config();const i=process.env.OPENAI_API_KEY,c=process.env.OPENAI_ORGANIZATION;i||(console.error("Error: OPENAI_API_KEY is required to use the OpenAI API"),process.exit(1));const l=new class{opeanai;constructor(e,t){this.opeanai=new o({apiKey:e,organization:t})}async translate(e,t){const n=e.trim().replace(/\s+/g," ");try{const e=await this.opeanai.chat.completions.create({model:"gpt-3.5-turbo-0125",messages:[{role:"system",content:"Translate texts accurately"},{role:"user",content:`Translate to ${t}: "${n}"`}],max_tokens:100});return console.log("OpenAI response:",e),console.log("response.choices:",e.choices),console.log("response.choices[0]?.message:",e.choices[0]?.message),e.choices[0]?.message?.content?.trim()||""}catch(e){console.error("Error translating text",e),process.exit(1)}}}(i,c);const[,,g]=process.argv;async function u(){try{const n=t.join(process.cwd(),"translation.config.js");e.existsSync(n)||(console.error("Error: translation.config.js not found."),process.exit(1));return(await import(n)).translationConfig}catch(e){console.error("Error loading configuration:",e.message),process.exit(1)}}"init"===g?async function(){console.log("Welcome to the Elevation Team Translation CLI!");let n=await r("Enter the base locale (en): ")||"en";const o=(await r("Enter target locales separated by space or comma (es): ")||"es").split(/[\s,]+/).filter((e=>e));if(0===o.length&&o.push(n),o.includes(n))return void console.log("Warning: The base language is also included in the target languages. Please select a different base language.");if(1===o.length&&o[0]===n)return void console.log("Warning: The target language is the same as the base language. Please select a different target language.");let s=await r("Enter the input directory when the baseFile is located (src/translations): ")||"src/translations",i=await r("Enter the output directory for generated translation files (src/translations): ")||"src/translations",c=await r("Enter the output format js or json (json): ")||"json";const l=t.join(process.cwd(),"translation.config.js");if(e.existsSync(l))return void console.log("Config file already exists at translation.config.js");const g=await r("Which AI provider do you want to use for translations? (openai): ")||"openai",u=`\nexport const translationConfig = {\n  defaultLanguage: '${n}', // Base language for translations\n  languages: ['${n}', ${o.map((e=>`'${e}'`)).join(", ")}], // Target languages for translations\n  inputDir: '${s}', // Directory for the base translation files\n  outputDir: '${i}', // Directory for the generated translation files\n  format: '${c}', // Output format (e.g., json, js)\n  aiProvider: '${g}', // AI provider for translations\n};\n\n`;e.writeFileSync(l,u),console.log("Config file created successfully at translation.config.js");const p=t.join(process.cwd(),"package.json");if(!e.existsSync(p))return void console.error("Error: package.json not found. Please ensure you are in a Node.js project.");const f=JSON.parse(e.readFileSync(p,"utf-8"));f.scripts=f.scripts||{},f.scripts["translation:watch"]?console.log('Script "translation:watch" already exists in package.json'):(f.scripts["translation:watch"]="et-translations watch",console.log('Script "translation:watch" added to package.json')),f.scripts["translation:run"]?console.log('Script "translation:run" already exists in package.json'):(f.scripts["translation:run"]="et-translations run",console.log('Script "translation:run" added to package.json')),e.writeFileSync(p,JSON.stringify(f,null,2)),a.close()}():"watch"===g?u().then((n=>async function(n){const{defaultLanguage:o,languages:s,inputDir:a,outputDir:r,format:i}=n,c=t.join(process.cwd(),a,`${o}.${i}`);e.existsSync(c)||(console.error(`Base file not found: ${c}`),process.exit(1)),e.watch(c,(async n=>{if("change"===n){console.log(`Changes detected in ${c}`);try{const n=JSON.parse(e.readFileSync(c,"utf-8"));for(const a of s){if(a===o)continue;const s=t.join(process.cwd(),r,`${a}.${i}`);let c={};e.existsSync(s)&&(c=JSON.parse(e.readFileSync(s,"utf-8")));const g=Object.entries(n).filter((([e,t])=>!c[e]||c[e]!==t)).map((([e,t])=>({key:e,value:t})));if(g.length>0){const t=await Promise.all(g.map((({value:e})=>l.translate(e,a)))),n={...c};g.forEach((({key:e},o)=>{n[e]=t[o]})),e.writeFileSync(s,JSON.stringify(n,null,2)),console.log(`Translation updated for ${a} at ${s}`)}}}catch(e){console.error(`Error processing translations: ${e.message}`)}}})),console.log(`Watching for changes in ${c}`)}(n))):"run"===g?u().then((n=>async function(n){const{defaultLanguage:o,languages:s,inputDir:a,outputDir:r,format:i}=n,c=t.join(process.cwd(),a,`${o}.${i}`);e.existsSync(c)||(console.error(`Base file not found: ${c}`),process.exit(1));try{const n=JSON.parse(e.readFileSync(c,"utf-8"));for(const a of s){if(a===o)continue;const s=t.join(process.cwd(),r,`${a}.${i}`);let c={};e.existsSync(s)&&(c=JSON.parse(e.readFileSync(s,"utf-8")));const g=Object.entries(n).filter((([e,t])=>!c[e]||c[e]!==t)).map((([e,t])=>({key:e,value:t})));if(g.length>0){const t=await Promise.all(g.map((({value:e})=>l.translate(e,a)))),n={...c};g.forEach((({key:e},o)=>{n[e]=t[o]})),e.writeFileSync(s,JSON.stringify(n,null,2)),console.log(`Translation updated for ${a} at ${s}`)}}}catch(e){console.error(`Error processing translations: ${e.message}`)}}(n))):(console.log('Unknown command. Use "init", "watch", or "run".'),process.exit(1));
