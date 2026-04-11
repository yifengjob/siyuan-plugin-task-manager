// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  // 1. 全局忽略目录（独立配置对象，仅包含 ignores）
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.eslintrc.*',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },

  // 2. ESLint 内置推荐规则
  eslint.configs.recommended,

  // 3. TypeScript 推荐规则
  tseslint.configs.recommended,

  // 4. Vue 基础配置（自动处理 .vue 文件解析器）
  pluginVue.configs['flat/base'],
  pluginVue.configs['flat/recommended'],

  // 5. 关闭与 Prettier 冲突的规则（必须在 Vue 配置之后，以覆盖 Vue 中与 Prettier 冲突的规则）
  eslintConfigPrettier,

  // 6. 自定义规则（覆盖以上所有预设）
  {
    files: [
      '**/*.{js,ts,jsx,tsx,vue}', // 统一匹配所有需要检查的文件
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    plugins: {
      prettier, // 启用 prettier/prettier 规则
    },
    rules: {
      // 基础规则
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

      // Vue 特定规则
      'vue/block-order': ['warn', { order: ['script', 'template', 'style'] }],
      'vue/html-indent': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',

      // Prettier 规则：作为 ESLint 规则运行
      'prettier/prettier': ['warn', { usePrettierrc: true }],
    },
  },

  // 7. 测试文件环境覆盖
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
