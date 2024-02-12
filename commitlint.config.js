module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [1, 'always', 72],
    'footer-max-line-length': [0, 'always'] // Make sure there is never a max-line-length by disabling the rule
  },
};