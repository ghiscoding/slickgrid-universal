import { copyFile, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/components/', import.meta.url), { recursive: true });
await Promise.all(
  ['SlickgridSvelte.svelte', 'SlickgridSvelte.svelte.d.ts'].map((name) =>
    copyFile(new URL(`../src/components/${name}`, import.meta.url), new URL(`../dist/components/${name}`, import.meta.url))
  )
);
