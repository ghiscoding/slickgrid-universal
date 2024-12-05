import { readFileSync, writeFileSync } from 'node:fs';

writeFileSync('dist/index.d.cts', readFileSync('dist/index.d.ts'));
