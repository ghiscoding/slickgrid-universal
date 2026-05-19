# eslint-plugin-import-ext — require-local-extension

📝 Enforce the style of file extensions in import declarations.

🔧 This rule is automatically fixable by the `--fix` CLI option.

Targets local imports (paths starting with `./` or `../`) and performs safe autofixes when run with `--fix`.

Supported targets
- `import` / `export` sources
- Common `require()` call sites

It recognizes many common extensions by default (`.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`, `.vue`, `.json`, images, styles, etc.) and supports Vite-style import query suffixes (e.g. `?raw`).

> [!NOTE]
> This ESLint plugin was created as a temporary workaround until the OXC/OXLint issue #19431 (https://github.com/oxc-project/oxc/issues/19431) is resolved. It helps catch missing local import file extensions during linting.
>
> Recommended migration (disable `import/extensions` and enable this rule):
>
> ```json
> {
>   "rules": {
>     "import/extensions": "off",
>     "import-ext/require-local-extension": ["error", { "js": "always", "ts": "never" }]
>   }
> }
> ```

Quick usage

Below are two example ways to enable the rule in an OXLint/ESLint config: a minimal "Basic" example and a more explicit "Full" example (recommended for repo-wide consistency).

Basic OXLint config

```json
{
  "plugins": ["import-ext"],
  "jsPlugins": ["eslint-plugin-import-ext"],
  "rules": {
    "import-ext/require-local-extension": [
      "error",
      {
        "js": "always",
        "ts": "never"
      }
    ]
}
```

Full OXLint config (recommended)

```json
{
  "plugins": ["import-ext"],
  "jsPlugins": ["eslint-plugin-import-ext"],
  "settings": {
    "localImportExt": {
      "preferredFixExt": ".js",
      "extRules": { "js": "always", "ts": "never" },
      "allowedExts": [".js",".mjs",".cjs",".ts",".tsx",".jsx",".vue",".json"],
      "excludedFolders": ["demos/**","test/**"],
      "ignorePackages": true
    }
  },
  "rules": {
    "import-ext/require-local-extension": [
      "error",
      {
        "preferredFixExt": ".js",
        "extRules": { "js": "always", "ts": "never" },
        "excludedFolders": ["demos/**","test/**"],
        "ignorePackages": true
      }
    ]
  }
}
```

Configuration options

Options can be passed either as rule options or via `settings.localImportExt`.

Key options:
- `excludedFolders`: array of repo-relative folder globs to ignore (e.g. tests, demos).
- `allowedExts`: array of allowed extensions for the rule.
- `preferredFixExt`: single extension (string) the fixer should prefer when offering fixes (defaults to `.js`).
- `disallowedExts`: array of extensions to explicitly avoid when fixing.

- `extRules`: object mapping extensions to `"always"` or `"never"` (also supports the n-style mapping described below).
- `ignorePackages`: when true, package imports (bare specifiers) are ignored and the rule only enforces local imports. This matches `import/extensions` compatibility where `"ignorePackages"` omits package imports from enforcement.

Two common config styles are supported:

- object form (recommended):

```json
{
    "rules": {
      "import-ext/require-local-extension": [
        "error",
        {
          "preferredFixExt": ".js",
          "extRules": { "js": "always", "ts": "never" },
          "excludedFolders": ["demos/aurelia/test"]
        }
      ]
    }
}
```

- n-style shorthand (like eslint-plugin-n):

```json
{
    "rules": {
      "import-ext/require-local-extension": [
        "error",
        {
          "js": "always",
          "ts": "never",
          "excludedFolders": ["demos/aurelia/test"]
        }
      ]
    }
}
```

How the fixer chooses an extension

- The fixer prefers `preferredFixExt` (default `.js`).
- If `preferredFixExt` is explicitly disallowed via `extRules`/`disallowedExts` (e.g. `"ts": "never"`), the fixer picks the first non-disallowed extension from its internal discovery order.
- Crucially, the autofixer now only offers a fix when the chosen target file actually exists on disk (either `base + ext` or `base/index + ext`). This prevents converting to extensions that don't exist in your repo.

Behavior notes

- Query/hash suffixes are preserved (e.g. `./file?raw` -> `./file.js?raw`).
- Original quote style (`'` or `"`) is preserved.
- Directory imports that resolve to an `index` file are supported (the fixer will append `/index.js` when that file exists).
- Asset and style imports are ignored if their extensions are included in `allowedExts`.

Examples (before -> after)

- Simple import

Before:
```js
Quick usage

Below are two example ways to enable the rule in an OXLint/ESLint config: a minimal "Basic" example and a more explicit "Full" example (recommended for repo-wide consistency).

Basic OXLint config

```json
{
  "plugins": ["import-ext"],
  "jsPlugins": ["eslint-plugin-import-ext"],
  "rules": {
    "import-ext/require-local-extension": [
      "error",
      {
        "js": "always",
        "ts": "never"
      }
    ]
  }
}
```

Full OXLint config (recommended)

```json
{
  "plugins": ["import-ext"],
  "jsPlugins": ["eslint-plugin-import-ext"],
  "settings": {
    "localImportExt": {
      "preferredFixExt": ".js",
      "extRules": { "js": "always", "ts": "never" },
      "allowedExts": [".js",".mjs",".cjs",".ts",".tsx",".jsx",".vue",".json"],
      "excludedFolders": ["demos/**","test/**"],
      "ignorePackages": true
    }
  },
  "rules": {
    "import-ext/require-local-extension": [
      "error",
      {
        "preferredFixExt": ".js",
        "extRules": { "js": "always", "ts": "never" },
        "excludedFolders": ["demos/**","test/**"],
        "ignorePackages": true
      }
    ]
  }
}
```

Configuration options

Options can be passed either as rule options or via `settings.localImportExt`.

Key options:
- `excludedFolders`: array of repo-relative folder globs to ignore (e.g. tests, demos).
- `allowedExts`: array of allowed extensions for the rule.
- `preferredFixExt`: single extension (string) the fixer should prefer when offering fixes (defaults to `.js`).
- `disallowedExts`: array of extensions to explicitly avoid when fixing.

- `extRules`: object mapping extensions to `"always"` or `"never"` (also supports the n-style mapping described below).
- `ignorePackages`: when true, package imports (bare specifiers) are ignored and the rule only enforces local imports. This matches `import/extensions` compatibility where `"ignorePackages"` omits package imports from enforcement.

Two common config styles are supported:

- object form (recommended):

```json
{
    "rules": {
      "import-ext/require-local-extension": [
        "error",
        {
          "preferredFixExt": ".js",
          "extRules": { "js": "always", "ts": "never" },
          "excludedFolders": ["demos/aurelia/test"]
        }
      ]
    }
}
```

- n-style shorthand (like eslint-plugin-n):

```json
{
    "rules": {
      "import-ext/require-local-extension": [
        "error",
        {
          "js": "always",
          "ts": "never",
          "excludedFolders": ["demos/aurelia/test"]
        }
      ]
    }
}
```
