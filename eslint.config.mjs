// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';

export default tseslint.config(
  // 1. ESLint 推荐规则
  eslint.configs.recommended,
  // 2. TypeScript 推荐规则
  ...tseslint.configs.recommended,
  // 3. 关闭与 Prettier 冲突的规则
  eslintConfigPrettier,
  // 4. Vue 插件基础配置（已包含 parser 设置）
  ...pluginVue.configs['flat/base'],
  ...pluginVue.configs['flat/recommended'],
  // 5. 自定义配置
  {
    files: ['**/*.vue', '**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier,
      vue: pluginVue,
    },
    rules: {
      // 基础规则 —— 适当放宽
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 强制使用 === 和 !==
      eqeqeq: ['error', 'always'],

      // 强制分号
      semi: ['error', 'always'],

      // Vue 特定规则
      'vue/html-indent': 'off', // 关闭 ESLint 缩进规则，由 Prettier 控制
      'vue/block-order': [
        'warn',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',

      // Prettier 格式化规则（作为 ESLint 规则运行）
      'prettier/prettier': [
        'warn',
        {
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 80,
          bracketSpacing: true,
          arrowParens: 'always',
        },
        { usePrettierrc: true },
      ],
    },
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.eslintrc.*',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  // 6. 测试文件覆盖
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
