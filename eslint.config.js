import globals from 'globals';
import { defineConfig } from 'eslint/config';
import importEslintPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import typescriptEslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: ['**/dist/', '**/coverage/'],
  },
  {
    extends: [js.configs.recommended, typescriptEslint.configs.recommended],
    plugins: {
      import: importEslintPlugin,
    },
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'import/extensions': [
        'error',
        'always',
        {
          ignorePackages: true,
          pathGroupOverrides: [
            {
              // ask for file extensions when importing from OL (since we can do granular imports inside the lib)
              pattern: 'ol/{*,*/**}',
              action: 'enforce',
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // test related
  {
    files: ['**/__mocks__/**/*'],
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
      },
    },
  },
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: {
        ...globals.commonjs,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
