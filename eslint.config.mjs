// ESLint flat config (ESLint 9+). Replaces the legacy .eslintrc.json, which ESLint 10
// no longer reads. Mirrors the old setup: eslint:recommended over TypeScript sources,
// with no-unused-vars/no-undef off (tsc --noEmit is the authority for both).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'dist-widgets/', 'node_modules/'] },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    extends: [js.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
);
