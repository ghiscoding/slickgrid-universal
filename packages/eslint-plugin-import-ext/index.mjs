import requireLocalExtension from './rules/require-local-extension.mjs';

export default {
  rules: {
    'require-local-extension': requireLocalExtension,
  },
  configs: {
    recommended: {
      plugins: ['import-ext'],
      rules: {
        'import-ext/require-local-extension': [
          'error',
          {
            excludedFolders: [],
          },
        ],
      },
    },
  },
};
