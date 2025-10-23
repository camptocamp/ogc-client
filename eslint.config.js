import { defineConfig } from 'eslint/config';
import importEslintPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import typescriptEslint from 'typescript-eslint';

export default defineConfig([
  {
    extends: [js.configs.recommended, typescriptEslint.configs.recommended],
    plugins: {
      import: importEslintPlugin,
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
    },
  },
]);
