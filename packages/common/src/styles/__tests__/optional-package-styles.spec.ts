/// <reference types="node" />

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mergePackageStyles } from '../../../../../packages/vanilla-force-bundle/merge-package-styles.mjs';

interface ZipReader {
  unzipSync(data: Uint8Array): Record<string, Uint8Array>;
  strFromU8(data: Uint8Array): string;
}

const root = resolve(import.meta.dirname, '../../../../..');
const commonRequire = createRequire(join(root, 'packages/common/package.json'));
const sass = commonRequire('sass') as typeof import('sass');
const postcss = commonRequire('postcss') as typeof import('postcss');
const packages = [
  ['composite-editor-component', 'slick-composite-editor', '.slick-editor-modal'],
  ['custom-tooltip-plugin', 'slick-custom-tooltip', '.slick-custom-tooltip'],
  ['row-detail-plugin', 'slick-row-detail', '.slick-row-detail-overlay'],
] as const;
const themes = ['default', 'bootstrap', 'fluent', 'material', 'salesforce'];
const variants = themes.flatMap((theme) => (theme === 'fluent' ? [theme] : [theme, `${theme}.lite`]));
const variableModules = ['variables', 'variables-theme-fluent', 'variables-theme-material', 'variables-theme-salesforce', 'svg-mixins'];
const themeCss = new Map<string, string>();
let fixture: string;
let commonStyles: string;

function compile(source: string) {
  return sass.compileString(source, {
    url: pathToFileURL(join(fixture, 'entry.scss')),
    loadPaths: [join(fixture, 'node_modules')],
    quietDeps: true,
    style: 'compressed',
  }).css;
}

function ruleCount(css: string, selector: string) {
  let count = 0;
  postcss.parse(css).walkRules((rule) => {
    if (rule.selector === selector) {
      count++;
    }
  });
  return count;
}

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), 'slickgrid-styles-'));
  commonStyles = join(fixture, 'common/dist/styles/sass');
  cpSync(join(root, 'packages/common/src/styles'), commonStyles, { recursive: true });
  mkdirSync(join(fixture, 'node_modules/@slickgrid-universal'), { recursive: true });
  symlinkSync(join(fixture, 'common'), join(fixture, 'node_modules/@slickgrid-universal/common'), 'junction');
  for (const dependency of ['sass', 'postcss', 'cssnano', 'autoprefixer', 'vanilla-calendar-pro', 'multiple-select-vanilla']) {
    symlinkSync(realpathSync(join(root, 'packages/common/node_modules', dependency)), join(fixture, 'node_modules', dependency), 'junction');
  }
  for (const [pkg, entry] of packages) {
    const cwd = join(fixture, pkg);
    cpSync(join(root, 'packages', pkg, 'src/styles'), join(cwd, 'src/styles'), { recursive: true });
    cpSync(join(root, 'packages', pkg, 'package.json'), join(cwd, 'package.json'));
    symlinkSync(join(fixture, 'node_modules'), join(cwd, 'node_modules'), 'junction');
    symlinkSync(cwd, join(fixture, 'node_modules/@slickgrid-universal', pkg), 'junction');
    execFileSync(process.execPath, [join(root, 'scripts/build-package-styles.mjs'), `src/styles/${entry}.scss`], { cwd });
  }
  for (const theme of variants) {
    themeCss.set(theme, compile(`@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-${theme}.scss';`));
  }
}, 60000);

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe('optional package styling', () => {
  it.each(variableModules)('%s emits no CSS', (module) => {
    expect(compile(`@use '@slickgrid-universal/common/dist/styles/sass/${module}';`)).toBe('');
  });

  it.each(variants)('%s excludes optional rules and retains the Salesforce ZIP insertion marker', (theme) => {
    const css = themeCss.get(theme)!;
    // Shared modal/LongText helpers and the Salesforce modified-cell token intentionally stay in common.
    for (const [, , selector] of packages) {
      expect(ruleCount(css, selector)).toBe(0);
    }
    expect(css).not.toMatch(/\.detail-view-toggle|\.dynamic-cell-detail|--slick-detail-view-|--slick-editor-modal-container-bg-color/);
    expect(css.split('li.hidden{')).toHaveLength(2);
  });

  it.each(packages)('%s ships isolated CSS for every theme and its Sass entry', (pkg, entry, selector) => {
    expect(readFileSync(join(fixture, pkg, `dist/styles/sass/${entry}.scss`), 'utf8')).toBe(
      readFileSync(join(root, 'packages', pkg, `src/styles/${entry}.scss`), 'utf8')
    );
    for (const theme of themes) {
      const css = readFileSync(join(fixture, pkg, `dist/styles/css/${entry}-${theme}.css`), 'utf8');
      expect(ruleCount(css, selector)).toBe(1);
      expect(css.includes('@keyframes')).toBe(false);
      postcss.parse(css).walkRules((rule) => {
        expect(rule.selector).not.toMatch(/^(?:\.vc[\s.{[:]|\.ms-(?:parent|drop|choice)|\.slick-header)/);
      });
      for (const [otherPkg, , otherSelector] of packages) {
        if (pkg !== otherPkg) {
          expect(ruleCount(css, otherSelector)).toBe(0);
        }
      }
    }
    const manifest = JSON.parse(readFileSync(join(fixture, pkg, 'package.json'), 'utf8'));
    expect(manifest.exports['./dist/styles/*']).toBe('./dist/styles/*');
    expect(manifest.files).toContain('/dist');
  });

  it.each(variants)('%s shares Sass overrides, preserves dark tokens and includes optional rules once', (theme) => {
    const css = compile(`
      @use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-${theme}.scss' with (
        $slick-editor-modal-container-width: 617px,
        $slick-tooltip-color: #123456,
        $slick-detail-view-container-padding: 17px
      );
      ${packages.map(([pkg, entry]) => `@use '@slickgrid-universal/${pkg}/dist/styles/sass/${entry}.scss';`).join('\n')}
    `);
    for (const [, , selector] of packages) {
      expect(ruleCount(css, selector)).toBe(1);
    }
    const values = (property: string) => {
      const result: string[] = [];
      postcss.parse(css).walkDecls(property, (declaration) => {
        result.push(declaration.value.replace(/,\s*/g, ','));
      });
      return result;
    };
    expect(values('width')).toContain('var(--slick-editor-modal-container-width,617px)');
    expect(values('color')).toContain('var(--slick-tooltip-color,#123456)');
    expect(values('padding')).toContain('var(--slick-detail-view-container-padding,17px)');
    expect(values('--slick-editor-modal-container-bg-color')).toContain('#333333');
    expect(values('--slick-detail-view-container-bgcolor')).toContain('#3c4349');
    expect(values('--slick-detail-view-icon-color')).toContain('var(--slick-primary-color)');
    const animations = (value: string) => value.match(/@keyframes sg-spin/g)?.length;
    expect(animations(css)).toBe(animations(themeCss.get(theme)!));
  });

  it('keeps Salesforce modal values and Fluent row detail icons in precompiled CSS', () => {
    const modal = readFileSync(join(fixture, 'composite-editor-component/dist/styles/css/slick-composite-editor-salesforce.css'), 'utf8');
    expect(modal).toContain('--lwc-fontSize7');
    const rowDetail = readFileSync(join(fixture, 'row-detail-plugin/dist/styles/css/slick-row-detail-fluent.css'), 'utf8');
    expect(/M18(?: |%20)10a8/.test(rowDetail)).toBe(true);
  });

  it('rejects configuring a theme after an optional Sass entry has loaded its variables', () => {
    expect(() =>
      compile(`
      @use '@slickgrid-universal/row-detail-plugin/dist/styles/sass/slick-row-detail.scss';
      @use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss' with ($slick-primary-color: red);
    `)
    ).toThrow(/already loaded/);
  });

  it('preserves the public SVG utility mixins and configurable viewbox', () => {
    const css = compile(`
      @use '@slickgrid-universal/common/dist/styles/sass/svg-utilities' as svg with ($viewboxSize: 31);
      @include svg.generateSvgClass('custom-icon', 'M0 0');
    `);
    expect(ruleCount(css, '.custom-icon')).toBe(1);
    expect(css).toContain('viewBox="0 0 31 31"');
    expect(css.match(/@keyframes sg-spin/g)).toHaveLength(1);
  });
});

describe('Salesforce ZIP style merging', () => {
  it('includes only the bundled optional packages in all nine archived theme stylesheets', () => {
    const cwd = join(fixture, 'vanilla-force-bundle');
    mkdirSync(join(cwd, 'dist/bundle'), { recursive: true });
    writeFileSync(join(cwd, 'dist/bundle/bundle.js'), '// ZIP fixture');
    cpSync(join(root, 'packages/vanilla-force-bundle/package.json'), join(cwd, 'package.json'));
    mkdirSync(join(fixture, 'common/dist/styles/css'), { recursive: true });
    for (const [theme, css] of themeCss) {
      writeFileSync(join(fixture, `common/dist/styles/css/slickgrid-theme-${theme}.css`), css);
    }
    execFileSync(process.execPath, [join(root, 'packages/vanilla-force-bundle/compress.mjs')], { cwd });
    const bundleRequire = createRequire(join(root, 'packages/vanilla-force-bundle/package.json'));
    const { unzipSync, strFromU8 } = bundleRequire('fflate') as ZipReader;
    const archive = unzipSync(readFileSync(join(cwd, 'dist/bundle.zip')));
    for (const theme of variants) {
      const css = strFromU8(archive[`styles/css/slickgrid-theme-${theme}.css`]);
      expect(ruleCount(css, '.slick-editor-modal')).toBe(1);
      expect(ruleCount(css, '.slick-custom-tooltip')).toBe(1);
      expect(css).not.toMatch(/\.slick-row-detail-overlay|\.detail-view-toggle|\.dynamic-cell-detail|--slick-detail-view-/);
    }
  });

  it.each(['', '.editor{color:red}'])('inserts styles before the marker with prefix %j', (prefix) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mergePackageStyles(`${prefix}li.hidden{display:none}`, '.optional{color:blue}', 'theme.css')).toBe(
      `${prefix}.optional{color:blue}\nli.hidden{display:none}`
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('appends styles and identifies the affected file when the marker is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mergePackageStyles('.editor{}', '.optional{}', 'theme.css')).toBe('.editor{}\n.optional{}');
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('"theme.css"; appending styles instead'));
    warn.mockRestore();
  });
});
