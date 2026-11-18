import { createRequire } from 'node:module';
import { mkdirSync, copyFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
mkdirSync('dist/mathjax', { recursive: true });
copyFileSync(require.resolve('mathjax-full/es5/tex-svg.js'), 'dist/mathjax/tex-svg.js');
copyFileSync(require.resolve('mathjax-full/LICENSE'), 'dist/mathjax/LICENSE');
