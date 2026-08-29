module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Two projects, same trick the official `firebase init functions`
    // template uses: tsconfig.json only includes src/, so without
    // tsconfig.dev.json (which includes just this file) ESLint can't
    // type-aware-lint .eslintrc.js itself.
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['lib/**/*', 'node_modules/**/*'],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
  },
};
