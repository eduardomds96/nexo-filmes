// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Micro-frontends do monorepo. Nenhum deles pode importar código de outro. */
const APPS = ['shell', 'catalogo', 'filme', 'minha-area'];

/** @param {string} self */
function appBoundary(self) {
  const others = APPS.filter((app) => app !== self);
  return {
    files: [`apps/${self}/**/*.{ts,tsx}`],
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: others.map((other) => ({
            target: `./apps/${self}`,
            from: `./apps/${other}`,
            message:
              'Um micro-frontend não importa código de outro. Use URL, eventos ou @nexo/contracts.',
          })),
        },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nexo/contracts',
              allowTypeImports: true,
              message: '@nexo/contracts só contém tipos: use `import type`.',
            },
          ],
          patterns: [
            {
              group: others.flatMap((other) => [`@nexo/${other}`, `@nexo/${other}/*`]),
              message: 'Um micro-frontend não importa código de outro.',
            },
          ],
        },
      ],
    },
  };
}

const localStorageMessage =
  'Acesse dados do usuário apenas pelo pacote @nexo/user-data (localStorage é detalhe de implementação dele).';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.__mf__temp/**',
      '**/__mf__temp/**',
      '**/@mf-types/**',
      '**/mockServiceWorker.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      'import-x': importX,
    },
    settings: {
      'import-x/resolver-next': [importX.createNodeResolver()],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'no-restricted-globals': ['error', { name: 'localStorage', message: localStorageMessage }],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: localStorageMessage },
        { object: 'globalThis', property: 'localStorage', message: localStorageMessage },
        { object: 'self', property: 'localStorage', message: localStorageMessage },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    ...jsxA11y.flatConfigs.strict,
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Fast refresh só importa nos apps (os dev servers); pacotes exportam hooks e helpers.
    files: ['apps/*/src/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  ...APPS.map(appBoundary),
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nexo/contracts',
              allowTypeImports: true,
              message: '@nexo/contracts só contém tipos: use `import type`.',
            },
          ],
          patterns: [
            {
              group: APPS.flatMap((app) => [`@nexo/${app}`, `@nexo/${app}/*`]),
              message: 'Bibliotecas (packages/*) não dependem de micro-frontends.',
            },
          ],
        },
      ],
    },
  },
  {
    // O único lugar autorizado a tocar no localStorage.
    files: ['packages/user-data/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
