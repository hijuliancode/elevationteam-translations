#!/usr/bin/env node

import { init } from './init';
import { run } from './run';
import { watch } from './watch';
import { check } from './check';
import { loadConfig } from './utils'

// Returns the command from the CLI arguments
const [,, command] = process.argv;

// Handle the CLI commands
if (command === 'init') {
  init();
} else if (command === 'run') {
  loadConfig().then(config => run(config));
} else if (command === 'watch') {
  loadConfig().then(config => watch(config));
} else if (command === 'check') {
  loadConfig().then(config => check(config));
} else {
  console.log('Unknown command. Use "init", "run", "watch", or "check".');
  process.exit(1);
}
