import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Boundary rules — see ADR 010. Features consume the api barrel only;
  // api never reaches into the presentation layer.
  {
    files: ['src/features/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api/*', '**/api/*/**'],
              message: 'Features import from the api barrel only (../../api). See ADR 010.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/api/**', 'src/lib/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/ui/**', '**/App'],
              message: 'api/ and lib/ must not depend on the presentation layer. See ADR 010.',
            },
          ],
        },
      ],
    },
  },
  prettier
)
