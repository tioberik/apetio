// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'src/db/migrations/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    rules: {
      // §10: nijedan hardkodiran string u JSX-u — sve kroz t('kljuc').
      'react/jsx-no-literals': [
        'warn',
        { noStrings: true, allowedStrings: ['#', '/', '·'], ignoreProps: true },
      ],
    },
  },
]);
