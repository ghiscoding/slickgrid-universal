import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const excludeVendorFromSourceMapPlugin = ({ filter }) => ({
  name: 'excludeVendorFromSourceMap',
  setup(esbuild) {
    esbuild.onLoad({ filter }, args => {
      if (args.path.endsWith('.js')) {
        return {
          contents:
            readFileSync(args.path, 'utf8') +
            '\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==',
          loader: 'default',
        };
      }
    });
  },
});

build({
  color: true,
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'Slicker',
  target: 'es2021',
  legalComments: 'external', // Move all legal comments to a .LEGAL.txt file
  mainFields: ['module', 'main'],
  sourcemap: false,
  sourcesContent: false,
  logLevel: 'error',
  outfile: 'dist/bundle/slickgrid-vanilla-bundle.js',
  plugins: [
    // we don't need sourcemap in Salesforce since it can't be used from inside static resouce (zip)
    excludeVendorFromSourceMapPlugin({ filter: /node_modules/ })
  ]
});