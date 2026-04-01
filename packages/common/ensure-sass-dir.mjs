import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const distPath = join(import.meta.dirname, 'dist', 'styles', 'css');

mkdirSync(distPath, { recursive: true });
