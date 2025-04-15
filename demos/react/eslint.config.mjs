import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  {
    plugins: {
      'react-hooks': reactHooks,
      react: reactPlugin,
      cypress,
    },
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
