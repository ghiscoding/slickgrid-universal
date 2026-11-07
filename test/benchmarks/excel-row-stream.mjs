import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const outputDir = path.join(root, 'test/benchmarks/dist');
await mkdir(outputDir, { recursive: true });
const require = createRequire(root + '/package.json');
const excelRequire = createRequire(root + '/packages/excel-export/package.json');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const mode = process.env.BENCH_MODE || 'baseline';
if (!['baseline', 'incremental'].includes(mode)) throw new Error('BENCH_MODE must be baseline or incremental');
const lazy = mode === 'incremental';
const rows = Number(process.env.BENCH_ROWS || 500000);
if (!Number.isSafeInteger(rows) || rows < 1) throw new Error('BENCH_ROWS must be a positive integer');
const bundle = await build({
  entryPoints: [path.join(root, 'test/benchmarks/excel-row-stream.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'Bench',
  platform: 'browser',
  alias: {
    '@slickgrid-universal/common': root + '/packages/common/src/index.ts',
    '@slickgrid-universal/utils': root + '/packages/utils/src/index.ts',
    'excel-builder-vanilla': excelRequire.resolve('excel-builder-vanilla'),
  },
});
const dom = new JSDOM('', { runScripts: 'outside-only', url: 'http://localhost/' });
dom.window.ReadableStream = ReadableStream;
dom.window.TextEncoder = TextEncoder;
dom.window.eval(bundle.outputFiles[0].text + '\nwindow.Bench=Bench;');
await dom.window.Bench.run(1000, lazy);
dom.window.benchmarkBlob = null;
if (global.gc) global.gc();
const result = await dom.window.Bench.run(rows, lazy);
console.log(JSON.stringify({ ...result, memory: process.memoryUsage(), peakRssKiB: process.resourceUsage().maxRSS }));
const blob = dom.window.benchmarkBlob;
await writeFile(path.join(outputDir, `excel-row-stream-${mode}.xlsx`), Buffer.from(await blob.arrayBuffer()));
dom.window.close();
