import { build } from 'vite';

const watch = process.argv.includes('--watch');

await build({
  configFile: './vite.config.ts',
  build: watch ? { watch: {} } : {},
});
