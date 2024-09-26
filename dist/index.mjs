#!/usr/bin/env node
import o from"fs";import t from"path";import n from"readline";import{OpenAI as s}from"openai";import e from"dotenv";import r from"chokidar";e.config();const a=new s({apiKey:process.env.OPENAI_API_KEY});async function c(o,t,n){const s={...t};for(const[e,r]of Object.entries(o))if("string"!=typeof r||t[e]&&t[e]===r)"object"==typeof r&&(s[e]=await c(r,t[e],n));else try{const o=await i(r,n);s[e]=o}catch(o){console.error(`Error translating key: ${e} to ${n}: ${o.message}`)}return s}async function i(o,t){try{const n=await a.chat.completions.create({model:"gpt-3.5-turbo-0125",messages:[{role:"system",content:`You are a professional translator. Translate the following text to ${t}:`},{role:"user",content:o}],temperature:.3,max_tokens:100});return console.log("---"),console.log("response",n),console.log("---"),console.log("response.choices",n.choices),console.log("---"),console.log("response.choices[0]",n.choices[0]),console.log("---"),console.log("response.choices[0]?.message",n.choices[0]?.message),console.log("---"),n.choices[0]?.message?.content?.trim()||o}catch(t){return console.error("Error translating text:",t.message),o}}const l=t.join(process.cwd(),"translations.config.js");async function g(){try{return o.existsSync(l)||(console.log("Error: translations.config.js not found."),process.exit(1)),(await import(l)).translationConfig}catch(o){console.error("Error loading configuration: ",o.message),process.exit(1)}}async function p(n){const{defaultLanguage:s,targetLanguages:e,inputDir:r,outputDir:a}=n,i=t.join(process.cwd(),r,`${s}.json`);o.existsSync(i)||(console.error(`Error: Base translation file not found at ${i}`),process.exit(1));try{const n=JSON.parse(o.readFileSync(i,"utf-8"));for(const r of e){if(r===s)continue;const e=t.join(process.cwd(),a,`${r}.json`);let i={};o.existsSync(e)&&(i=JSON.parse(o.readFileSync(e,"utf-8")));const l=await c(n,i,r);o.writeFileSync(e,JSON.stringify(l,null,2)),console.log(`Translations updated for ${r} at ${e}`)}}catch(o){console.error("Error processing translations: ",o.message),process.exit(1)}}const u=n.createInterface({input:process.stdin,output:process.stdout});function f(o){return new Promise((t=>u.question(o,t)))}const[,,y]=process.argv;"init"===y?async function(){console.log("Welcome to the ElevationTeam Translation CLI!");const n=t.join(process.cwd(),"package.json");o.existsSync(n)||(console.error("Error: package.json not found. Please ensure you are in a Node.js project."),process.exit(1));const s=JSON.parse(o.readFileSync(n,"utf-8"));if(o.existsSync(l)){const t=await f("Config file already exists at translations.config.js, do you want to overwrite it?: (no) ")||"n";"yes"!==t.toLowerCase()&&"y"!==t.toLowerCase()&&(console.log("Exiting..."),process.exit(0)),o.unlinkSync(l)}let e=await f("Enter the base language: (en) ")||"en";const r=(await f("Enter target locales separated by space or comma: (es) ")||"es").split(/[\s,]+/).filter((o=>o));let a=await f("Enter the input directory when the baseFile is located: (src/translations) ")||"src/translations",c=await f("Enter the output directory for generated translation files: (src/translations) ")||"src/translations";const i=`export const translationConfig = {\n  defaultLanguage: '${e}', // Base language for translations\n  languages: [${g=r,console.log("formatting languages..."),g.filter(((o,t)=>o!==e&&g.indexOf(o)===t)).map((o=>`'${o}'`))}], // Target languages for translations\n  inputDir: '${a}', // Directory where is the base translation file\n  outputDir: '${c}', // Directory for the generated translation files\n}\n`;var g;"y"!==(await f(`About to write to ${l}:\n${i}\nIs this OK? (yes) `)||"y").toLowerCase()&&(console.log("Aborted."),process.exit(0)),o.writeFileSync(l,i),console.log("Config file created successfully at translations.config.js"),s.scripts=s.scripts||{},s.scripts["translation:run"]?console.log('Script "translation:run" already exists in package.json'):(s.scripts["translation:run"]="et-translations run",console.log('Script "translation:run" added to package.json')),s.scripts["translation:watch"]?console.log('Script "translation:watch" already exists in package.json'):(s.scripts["translation:watch"]="et-translations watch",console.log('Script "translation:watch" added to package.json')),o.writeFileSync(n,JSON.stringify(s,null,2)),u.close()}():"run"===y?g().then((o=>async function(o){await p(o)}(o))):"watch"===y?g().then((n=>async function(n){const{defaultLanguage:s,inputDir:e}=n,a=t.join(process.cwd(),e,`${s}.json`);o.existsSync(a)||(console.error(`Error: Base translation file not found at ${a}`),process.exit(1)),r.watch(a).on("change",(async()=>{console.log("Translation file changed. Processing translations...");try{await p(n),console.log("Translations processed successfully.")}catch(o){console.error("Error processing translations: ",o.message)}console.log(`Watching for changes in ${a}`)}))}(n))):(console.log('Unknown command. Use "init", "run", or "watch".'),process.exit(1));
