#!/usr/bin/env node

import { init } from './init';
import { watch } from './watch';
import { run } from './run'; // Asegúrate de tener implementado este archivo para ejecutar la traducción manual
import path from 'path';

const [,, command] = process.argv;

function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'translation.config.js');

    // Ensure the config file exists
    if (!require('fs').existsSync(configPath)) {
      console.error('Error: translation.config.js not found. Please run "init" first.');
      process.exit(1);
    }

    // Load the configuration
    const config = require(configPath).translationConfig;
    return config;
  } catch (error) {
    console.error('Error loading configuration:', (error as Error).message);
    process.exit(1);
  }
}

// Handle the CLI commands
if (command === 'init') {
  init();
} else if (command === 'watch') {
  const config = loadConfig();
  watch(config);
} else if (command === 'run') {
  const config = loadConfig();
  run(config); // Ejecuta la función de traducción manual
} else {
  console.log('Unknown command. Use "init", "watch", or "run".');
}
