import eslint from '@eslint/js';
import cypress from 'eslint-plugin-cypress/flat';
import globals from 'globals';
import vitest from '@vitest/eslint-plugin';
import n from 'eslint-plugin-n';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/*.{js,mjs}',
      '**/*/*.d.ts',
      '**/dist',
    ],
  },
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    plugins: {
      cypress,
      vitest,
      n
    },
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.browser,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.base.json'],
        tsconfigRootDir: import.meta.dirname,
      }
    },
    settings: {
      node: {
        tryExtensions: ['.ts'],
        resolvePaths: ['node_modules/@types']
      }
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' }, // maybe we should turn this on in a new PR
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'destructuredArrayIgnorePattern': '^_', caughtErrors: 'none' }],
      'cypress/no-assigning-return-values': 'off',
      'cypress/unsafe-to-chain-command': 'off',
      'object-shorthand': 'error',
      'n/file-extension-in-import': ['error', 'always'],
      'no-async-promise-executor': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      'no-extra-boolean-cast': 'off',
      'semi': 'off',
    }
  });
