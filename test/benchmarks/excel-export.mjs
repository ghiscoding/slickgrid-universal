// Compare a baseline revision with the working tree. Bundles/results are ignored in dist/.
// node test/benchmarks/excel-export.mjs before <baseline-commit>
// node test/benchmarks/excel-export.mjs after
// The bundle also exposes ExcelExportBenchmark.runBenchmark() in a browser.
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import inspector from 'node:inspector';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const require = createRequire(import.meta.url);
const esbuildPackage = (await readdir(path.join(root, 'node_modules/.pnpm'))).find((name) => name.startsWith('esbuild@'));
const { build } = require(path.join(root, 'node_modules/.pnpm', esbuildPackage, 'node_modules/esbuild'));
const excelRequire = createRequire(path.join(root, 'packages/excel-export/package.json'));
const label = process.argv[2] ?? 'current';
if (!/^[a-z-]+$/.test(label)) {
  throw new Error('Use a simple alphabetic label');
}
const outputDirectory = path.join(root, 'test/benchmarks/dist');
await mkdir(outputDirectory, { recursive: true });
const bundle = await build({
  entryPoints: [path.join(root, 'test/benchmarks/excel-export.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ExcelExportBenchmark',
  platform: 'browser',
  plugins:
    label === 'before'
      ? [
          {
            name: 'baseline-production-sources',
            setup(builder) {
              builder.onLoad({ filter: /(?:domUtils|slickDataView|excelExport\.service)\.ts$/ }, (args) => {
                const relative = path.relative(root, args.path).replaceAll('\\', '/');
                const contents = execFileSync(
                  'git',
                  ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'show', `${process.argv[3] ?? 'HEAD'}:${relative}`],
                  { cwd: root, encoding: 'utf8' }
                );
                return { contents, loader: 'ts' };
              });
            },
          },
        ]
      : [],
  alias: {
    '@slickgrid-universal/common': path.join(root, 'packages/common/src/index.ts'),
    '@slickgrid-universal/utils': path.join(root, 'packages/utils/src/index.ts'),
    'excel-builder-vanilla': excelRequire.resolve('excel-builder-vanilla'),
  },
});
const source = `${bundle.outputFiles[0].text}\nwindow.ExcelExportBenchmark = ExcelExportBenchmark;`;
await writeFile(path.join(outputDirectory, `excel-export-${label}.js`), source);
const dom = new JSDOM('', { runScripts: 'outside-only', url: 'http://localhost/' });
dom.window.ReadableStream = ReadableStream;
dom.window.TextEncoder = TextEncoder;
dom.window.eval(source);
// Warm up a smaller dataset, then profile three measured samples.
await dom.window.ExcelExportBenchmark.runBenchmark(100, 20, label === 'before' ? 1000 : undefined);
const session = new inspector.Session();
session.connect();
const post = (method) =>
  new Promise((resolve, reject) => session.post(method, (error, result) => (error ? reject(error) : resolve(result))));
await post('Profiler.enable');
await post('Profiler.start');
const samples = [];
for (let sample = 0; sample < 3; sample++) {
  const results = await dom.window.ExcelExportBenchmark.runBenchmark(5000, 20, label === 'before' ? 1000 : undefined);
  samples.push(results);
  console.log(JSON.stringify({ environment: 'Node + jsdom (not browser)', label, sample, results }));
}
const { profile } = await post('Profiler.stop');
session.disconnect();
await writeFile(path.join(outputDirectory, `excel-export-${label}.cpuprofile`), JSON.stringify(profile));
await writeFile(path.join(outputDirectory, `excel-export-${label}.json`), JSON.stringify(samples, null, 2));
dom.window.close();
