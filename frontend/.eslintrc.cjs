/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    // This codebase uses `any` in a few boundary layers (Wails bindings, service adapters).
    '@typescript-eslint/no-explicit-any': 'off',

    // Use TS-aware unused-vars; keep it non-blocking.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // Allow intentional empty catch blocks (cleanup / best-effort)
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
