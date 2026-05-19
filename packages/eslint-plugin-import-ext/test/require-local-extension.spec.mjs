import fs from 'node:fs';
import path from 'node:path';
import { afterAll, test } from 'vitest';

// Ensure `--fix` is present before loading the rule so the fixer is registered.
const originalArgv = process.argv.slice();
if (!process.argv.includes('--fix')) process.argv.push('--fix');

// dynamic import so argv is already modified before modules evaluate
const { RuleTester } = await import('eslint');
const ruleModule = await import('../rules/require-local-extension.mjs');
const rule = ruleModule.default;

afterAll(() => {
  // restore argv to avoid polluting other tests
  process.argv.length = 0;
  process.argv.push(...originalArgv);
});

// helper to create fixture files
function writeFixture(relPath, content = '') {
  const root = path.resolve(process.cwd(), 'packages', 'eslint-plugin-import-ext', 'test', 'fixtures');
  const abs = path.join(root, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return abs;
}

function removeFixture(relPath) {
  const root = path.resolve(process.cwd(), 'packages', 'eslint-plugin-import-ext', 'test', 'fixtures');
  const abs = path.join(root, relPath);
  try {
    fs.rmSync(abs, { force: true, recursive: true });
  } catch (e) {}
}

test('discovered extension is preferred when existing', () => {
  writeFixture('prefer/prefer-me.ts', 'export const x = 1;');

  ruleTester.run('require-local-extension', rule, {
    valid: [],
    invalid: [
      {
        filename: path.join('packages', 'eslint-plugin-import-ext', 'test', 'fixtures', 'prefer', 'tstarget.js'),
        code: "import '../fixtures/prefer/prefer-me';",
        output: "import '../fixtures/prefer/prefer-me.js';",
        errors: 1,
      },
    ],
  });

  removeFixture('prefer');
});

test('preferredFixExt applied when no discovered file exists', () => {
  ruleTester.run('require-local-extension', rule, {
    valid: [],
    invalid: [
      {
        code: "import './does-not-exist';",
        output: "import './does-not-exist.js';",
        errors: 1,
      },
    ],
  });
});

test('disallowedExts prevents fixer when preferred is disallowed', () => {
  ruleTester.run('require-local-extension', rule, {
    valid: [],
    invalid: [
      {
        code: "import './no-fix-when-disallowed';",
        options: [{ disallowedExts: ['.js'] }],
        errors: 1,
      },
    ],
  });
});

test('directory index resolution', () => {
  writeFixture('widget/index.js', 'export default "ok";');

  ruleTester.run('require-local-extension', rule, {
    valid: [],
    invalid: [
      {
        filename: path.join('packages', 'eslint-plugin-import-ext', 'test', 'fixtures', 'widget', 'caller.js'),
        code: "import widget from '../fixtures/widget';",
        output: "import widget from '../fixtures/widget.js';",
        errors: 1,
      },
    ],
  });

  removeFixture('widget');
});

test('ignorePackages false will flag bare specifiers', () => {
  ruleTester.run('require-local-extension', rule, {
    valid: [],
    invalid: [
      {
        code: "import pkg from 'lodash';",
        options: [{ ignorePackages: false }],
        errors: 1,
      },
    ],
  });
});

test('excludedFolders are skipped', () => {
  ruleTester.run('require-local-extension', rule, {
    valid: [
      {
        filename: path.join('demos', 'a', 'file.js'),
        code: "import './something';",
        options: [{ excludedFolders: ['demos'] }],
      },
    ],
    invalid: [],
  });
});

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020, sourceType: 'module' } });

test('require-local-extension RuleTester', () => {
  ruleTester.run('require-local-extension', rule, {
    valid: ["import './file.js';", "import './file.js?raw';", "const x = require('./file.js');", "import pkg from 'lodash';"],

    invalid: [
      {
        code: "import './file';",
        output: "import './file.js';",
        errors: [
          {
            message: "Local import './file' must include a file extension (e.g. .js, .vue)",
          },
        ],
      },
      {
        code: "import tpl from './template?raw';",
        output: "import tpl from './template.js?raw';",
        errors: 1,
      },
    ],
  });
});
