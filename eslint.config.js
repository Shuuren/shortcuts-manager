import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server/**']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['server/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Ignore uppercase variables (React components) and 'motion' (framer-motion JSX namespace)
      'no-unused-vars': ['error', { varsIgnorePattern: '^([A-Z_]|motion$)' }],
      // Allow exporting hooks alongside components (common pattern for context files)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
