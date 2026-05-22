module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:jsx-a11y/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['jsx-a11y'],
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  overrides: [
    {
      files: ['tests/**/*.test.ts'],
      env: {
        jest: true,
      },
    },
  ],
  rules: {
    'jsx-a11y/anchor-is-valid': 'off',
    'no-unused-vars': 'off',
  },
};
