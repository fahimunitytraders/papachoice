import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await build({
  entryPoints: ['src/lambda.js'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  sourcemap: false,
  minify: true,
  logLevel: 'info',
});
await writeFile('dist/package.json', JSON.stringify({ type: 'commonjs' }));
