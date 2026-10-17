import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, __SITE_URL__: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Con jsx-uses-vars, ESLint cuenta el uso en JSX: ya no hace falta
      // ignorar todo lo que empiece en mayúscula (eso ocultaba imports muertos).
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'react/jsx-uses-vars': 'error',
      // Un componente sin importar (<Styles /> huérfano) pasaba lint y build
      // y rompía en runtime: esto lo frena antes del commit.
      'react/jsx-no-undef': ['error', { allowGlobals: false }],
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/no-children-prop': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/no-danger-with-children': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/void-dom-elements-no-children': 'error',
    },
  },
  {
    files: ['vite.config.js', 'build/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])
