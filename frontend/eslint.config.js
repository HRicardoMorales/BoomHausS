import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
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
      // Accesibilidad estática: labels, handlers en elementos no interactivos,
      // alt, roles ARIA válidos. El objetivo es 0 avisos, no desactivar reglas.
      jsxA11y.flatConfigs.recommended,
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
      // Un carrusel con scroll propio tiene que poder enfocarse para moverlo
      // con el teclado (axe: scrollable-region-focusable); el patrón WAI es
      // role="region" + aria-label + tabIndex={0}.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: [], roles: ['tabpanel', 'region'] }],
      // La plata se formatea solo en utils/pricing.js (moneyARS/moneyARSTight).
      // Había 15 copias con criterios distintos para NaN y espacios.
      'no-restricted-syntax': ['error', {
        selector: "NewExpression[callee.object.name='Intl'][callee.property.name='NumberFormat'] Property[key.name='currency']",
        message: 'Usá moneyARS/moneyARSTight de utils/pricing.js en lugar de un Intl.NumberFormat de moneda.',
      }],
    },
  },
  {
    files: ['src/utils/pricing.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // CheckoutSheet: pasos 1-4 inalcanzables y con lógica de pago (ver
    // "Pendientes para Rick" en NIGHTLY.md). Se limpia cuando se decida su
    // destino; mientras tanto no bloquea el lint de accesibilidad.
    files: ['src/pages/CheckoutSheet.jsx'],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
    },
  },
  {
    files: ['vite.config.js', 'build/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])
