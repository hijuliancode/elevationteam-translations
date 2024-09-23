#!/usr/bin/env node

import { init } from './init';
import { watch } from './watch';
import { run } from './run';
import path from 'path';
import fs from 'fs';

const [,, command] = process.argv;

async function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'translation.config.js');

    // Ensure the config file exists
    if (!fs.existsSync(configPath)) {
      console.error('Error: translation.config.js not found.');
      process.exit(1);
    }

    // Load the configuration
    const config = (await import(configPath)).translationConfig;
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
  loadConfig().then(config => watch(config));
} else if (command === 'run') {
  loadConfig().then(config => run(config));
} else {
  console.log('Unknown command. Use "init", "watch", or "run".');
  process.exit(1);
}

