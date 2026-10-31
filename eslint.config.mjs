import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'apps/data/**', 'data/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  {
    // Configuraciones en CommonJS (por ejemplo tailwind.config.js)
    files: ['**/*.config.{js,cjs}'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  {
    rules: {
      // Los componentes de shadcn/ui declaran interfaces vacías que extienden las props de HTML
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      // Hay `as any` en repositorios y rutas; se eliminan en el refactor de mappers (#27).
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Desactiva las reglas de estilo que choquen con Prettier
  prettier
)
