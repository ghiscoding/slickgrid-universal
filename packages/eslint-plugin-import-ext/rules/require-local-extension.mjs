import fs from 'node:fs';
import path from 'path';

const defaultAllowedExts = [
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.vue',
  '.json',
  // images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
  '.ico',
  // styles
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.styl',
  // markup / templates
  '.html',
  '.htm',
  // media
  '.mp3',
  '.mp4',
  '.wav',
  '.webm',
];

function normalizeSlashes(value) {
  return value.replace(/\\/g, '/');
}

function isFileExcludedForPath(filePath, excludedFolders) {
  if (!filePath || filePath === '<input>') return false;
  const rel = normalizeSlashes(path.relative(process.cwd(), filePath));
  if (rel.includes('node_modules') || rel.includes('generated-parser') || rel.includes('/dist/')) return true;
  return excludedFolders.some((p) => rel === p || rel.startsWith(p + '/'));
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require file extension on local imports (./ or ../)',
      category: 'Possible Errors',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          excludedFolders: { type: 'array', items: { type: 'string' } },
          allowedExts: { type: 'array', items: { type: 'string' } },
          preferredFixExt: { type: 'string' },
          disallowedExts: { type: 'array', items: { type: 'string' } },
          extRules: {
            type: 'object',
            additionalProperties: { enum: ['always', 'never'] },
          },
          ignorePackages: { type: 'boolean' },
        },
        // allow top-level per-extension keys like "js": "always" or "ts": "never"
        patternProperties: {
          '^\\.?[a-z0-9]{1,5}$': { enum: ['always', 'never'] },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const rawOptions = context.options || [];
    const settings = (context.settings && context.settings.localImportExt) || {};

    // support two config styles:
    // 1) ['error', {'.ts': 'never'}] (like eslint-plugin-n) where options[1] is the mapping
    // 2) [{ allowedExts: [...], preferredFixExt: '.js', extRules: {...} }]
    let userOptions = {};
    if (rawOptions.length > 0) {
      if (typeof rawOptions[0] === 'object' && !Array.isArray(rawOptions[0])) {
        userOptions = rawOptions[0];
      } else if (rawOptions.length > 1 && typeof rawOptions[1] === 'object' && !Array.isArray(rawOptions[1])) {
        // support ['error', {'.ts': 'never'}] or ['always', { extRules: {...} }]
        userOptions = rawOptions[1];
      }
    }

    const allowedExts = new Set((userOptions.allowedExts || settings.allowedExts || defaultAllowedExts).map((e) => e.toLowerCase()));

    const preferredFixExtRaw = userOptions.preferredFixExt || settings.preferredFixExt || '.js';
    const preferredFixExt = preferredFixExtRaw.startsWith('.') ? preferredFixExtRaw.toLowerCase() : '.' + preferredFixExtRaw.toLowerCase();
    const defaultExcluded = [];
    const excludedFolders = userOptions.excludedFolders || settings.excludedFolders || defaultExcluded;

    // extRules may be provided directly as mapping (['error', {'.ts':'never'}]) or under extRules
    const extRules = userOptions.extRules || (typeof userOptions === 'object' ? userOptions : {});
    const disallowedExts = new Set(
      (userOptions.disallowedExts || settings.disallowedExts || Object.keys(extRules).filter((k) => extRules[k] === 'never')).map((e) =>
        e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase()
      )
    );

    // default: ignore package imports (only enforce local imports)
    const ignorePackages = Object.prototype.hasOwnProperty.call(userOptions, 'ignorePackages')
      ? Boolean(userOptions.ignorePackages)
      : Object.prototype.hasOwnProperty.call(settings, 'ignorePackages')
        ? Boolean(settings.ignorePackages)
        : true;

    function checkSource(node, sourceValue) {
      const filename = context.getFilename && context.getFilename();
      if (isFileExcludedForPath(filename, excludedFolders)) return;

      if (typeof sourceValue !== 'string') return;
      const isLocal = /^\.\.?\//.test(sourceValue);
      // If it's not a local import and the config asks to ignore packages, skip it.
      if (!isLocal && ignorePackages) return;
      if (sourceValue.endsWith('/')) return; // directory import
      const ext = (path.extname(sourceValue.split('?')[0].split('#')[0]) || '').toLowerCase();
      if (!ext || !allowedExts.has(ext)) {
        const sourceCode = context.getSourceCode();
        // attempt to find a candidate file to auto-fix (only for local imports)
        const raw = sourceValue;
        const base = raw.split('?')[0].split('#')[0];
        const suffix = raw.slice(base.length);
        const fileDir = filename && filename !== '<input>' ? path.dirname(filename) : process.cwd();
        const absBase = path.resolve(fileDir, base);

        // discovery order for existing files
        const fixExtOrder = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.vue', '.json'];

        let found = null;
        let foundIsIndex = false;

        if (isLocal) {
          for (const e of fixExtOrder) {
            const candidate = absBase + e;
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
              found = e;
              foundIsIndex = false;
              break;
            }
          }

          // try index files if base refers to a directory
          if (!found) {
            for (const e of fixExtOrder) {
              const candidate = path.join(absBase, 'index' + e);
              if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                found = e;
                foundIsIndex = true;
                break;
              }
            }
          }
        }

        const report = {
          node,
          message: "Local import '{{value}}' must include a file extension (e.g. .js, .vue)",
          data: { value: sourceValue },
        };

        // Only register a fixer when ESLint was invoked with `--fix` (CLI or npm script)
        const isCliFix = Array.isArray(process.argv) && process.argv.some((a) => a === '--fix' || a.startsWith('--fix'));
        // Register fixer only when running the CLI with --fix and for local imports
        if (isLocal && isCliFix) {
          // Determine a safe extension to use for the fix. Preference order:
          // 1) If we discovered an existing file (`found`), prefer it unless it's disallowed.
          // 2) Otherwise, prefer `preferredFixExt` (unless disallowed) but only if that file actually exists.
          let chosenExt = null;

          if (found) {
            if (!disallowedExts.has(found)) {
              chosenExt = found;
            } else {
              // if the discovered ext is disallowed, prefer the user-preferred fix ext when allowed
              if (!disallowedExts.has(preferredFixExt)) {
                chosenExt = preferredFixExt;
              } else {
                // otherwise try to find another existing ext that is allowed
                const alt = fixExtOrder.find((e) => {
                  const candidate = foundIsIndex ? path.join(absBase, 'index' + e) : absBase + e;
                  return !disallowedExts.has(e) && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
                });
                if (alt) chosenExt = alt;
              }
            }
          } else {
            // No discovered ext; prefer preferredFixExt when allowed (even if target file doesn't exist)
            let candidateExt = preferredFixExt;
            if (disallowedExts.has(candidateExt)) {
              candidateExt = fixExtOrder.find((e) => !disallowedExts.has(e)) || preferredFixExt;
            }
            // If preferred/fallback ext exists, use it. If not, still allow preferredFixExt to be used
            // to restore autofix behavior (user preference) — but only when it's not disallowed.
            const candidatePath = foundIsIndex ? path.join(absBase, 'index' + candidateExt) : absBase + candidateExt;
            if (!disallowedExts.has(preferredFixExt)) {
              chosenExt = preferredFixExt;
            } else if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
              chosenExt = candidateExt;
            }
          }

          if (chosenExt) {
            report.fix = (fixer) => {
              let newPath;
              if (foundIsIndex) {
                newPath = base.replace(/\/$/, '') + '/index' + chosenExt + suffix;
              } else {
                newPath = base + chosenExt + suffix;
              }
              const sourceCode = context.getSourceCode();
              const sourceNode = node; // node is the literal node when called
              const origText = sourceCode.getText(sourceNode);
              const origQuote = origText[0] === "'" || origText[0] === '"' ? origText[0] : '"';
              const replaced = origQuote + newPath + origQuote;
              return fixer.replaceText(sourceNode, replaced);
            };
          }
        }

        context.report(report);
      }
    }

    return {
      ImportDeclaration(node) {
        checkSource(node.source, node.source && node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) checkSource(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) checkSource(node.source, node.source.value);
      },
      CallExpression(node) {
        // require('...') style
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal'
        ) {
          checkSource(node.arguments[0], node.arguments[0].value);
        }
      },
    };
  },
};
