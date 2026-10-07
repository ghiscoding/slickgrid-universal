import { copyFileSync, globSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

/**
 * Build the styling of an optional package (run from the package folder), e.g. `node ../../scripts/build-package-styles.mjs --name slick-composite-editor`
 *  - copies `src/styles/*.scss` to `dist/styles/sass`
 *  - compiles `src/styles/{name}.scss` once per SlickGrid theme to `dist/styles/css/{name}-{theme}.css` (minified & autoprefixed)
 */
const { values } = parseArgs({ options: { name: { type: 'string' } } });
if (!values.name) {
  console.error('Please provide the stylesheet name to compile, e.g.: --name slick-composite-editor');
  process.exit(1);
}

// theme name => common SASS variables module used by that theme
const themes = {
  bootstrap: 'variables',
  default: 'variables',
  fluent: 'variables-theme-fluent',
  material: 'variables-theme-material',
  salesforce: 'variables-theme-salesforce',
};

const cwd = process.cwd();
const pkgRequire = createRequire(join(cwd, 'package.json'));
const sass = pkgRequire('sass');
const postcss = pkgRequire('postcss');
const autoprefixer = pkgRequire('autoprefixer');
const cssnano = pkgRequire('cssnano');

const srcDir = join(cwd, 'src', 'styles');
const sassOutDir = join(cwd, 'dist', 'styles', 'sass');
const cssOutDir = join(cwd, 'dist', 'styles', 'css');
mkdirSync(sassOutDir, { recursive: true });
mkdirSync(cssOutDir, { recursive: true });

for (const file of globSync('*.scss', { cwd: srcDir })) {
  copyFileSync(join(srcDir, file), join(sassOutDir, basename(file)));
}

for (const [theme, variablesModule] of Object.entries(themes)) {
  // load the theme variables first so the component reuses the same (theme configured) variables module
  const source = `@use '@slickgrid-universal/common/dist/styles/sass/${variablesModule}';\n@use './${values.name}';\n`;
  const { css } = sass.compileString(source, {
    loadPaths: [join(cwd, 'node_modules')],
    quietDeps: true,
    style: 'compressed',
    url: pathToFileURL(join(srcDir, `__${theme}.scss`)),
  });
  const outFile = join(cssOutDir, `${values.name}-${theme}.css`);
  // `from` is required for cssnano/autoprefixer to find the package `browserslist` (otherwise it falls back to older browser defaults)
  const result = await postcss([cssnano, autoprefixer]).process(css, { from: outFile, to: outFile });
  writeFileSync(outFile, result.css);
  console.log(`Compiled "${outFile}"`);
}
