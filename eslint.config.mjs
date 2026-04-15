// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import perfectionist from 'eslint-plugin-perfectionist';
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
  pluginVue.configs['flat/essential'],
  pluginVue.configs['flat/strongly-recommended'],
  pluginVue.configs['flat/recommended'],
  // 5. Perfectionist 配置
  perfectionist.configs['recommended-natural'],
  // 6. 关闭与 Prettier 冲突的规则（必须在 Vue 配置之后，以覆盖 Vue 中与 Prettier 冲突的规则）
  eslintConfigPrettier,

  // 7. 自定义规则（覆盖以上所有预设）
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
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
      prettier,
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

      // Prettier 规则：作为 ESLint 规则运行
      'prettier/prettier': ['warn', { usePrettierrc: true }],
    },
  },

  // 8. Vue 文件特定配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: tseslint.parser, // 为 Vue 文件中的 <script> 块指定 TS 解析器
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // 关闭 perfectionist 与 vue/order-in-components 冲突的规则
      'perfectionist/sort-objects': 'off',
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Vue 特定规则 - Priority A: Essential
      'vue/block-order': [
        'error',
        { order: ['script', 'template', 'style[scoped]', 'style:not([scoped])'] },
      ],
      'vue/no-import-compiler-macros': 'error',
      'vue/no-v-html': [
        'error',
        {
          ignorePattern: 'TrustedHtml$',
        },
      ],

      // Priority B: Strongly Recommended - 提升代码可读性
      'vue/attribute-hyphenation': ['error', 'always'], // 模板属性使用 kebab-case
      'vue/component-name-in-template-casing': ['error', 'PascalCase'], // 模板组件名使用 PascalCase
      'vue/custom-event-name-casing': ['error', 'kebab-case'], // 自定义事件使用 kebab-case
      'vue/define-emits-declaration': 'error',
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineProps', 'defineEmits', 'defineOptions', 'defineSlots'],
          defineExposeLast: true,
        },
      ],
      'vue/html-comment-content-newline': 'off', // 与 Prettier 冲突，关闭
      'vue/html-comment-indent': 'off', // 与 Prettier 冲突，关闭
      'vue/match-component-file-name': 'warn', // 组件文件名匹配（警告级别）
      'vue/no-child-content': 'error', // 禁止 v-html/v-text 的子内容
      'vue/no-duplicate-attributes': 'error', // 禁止重复属性
      'vue/no-duplicate-class-names': 'error',
      'vue/no-empty-component-block': 'error',
      'vue/no-multi-spaces': 'error', // 禁止多个空格
      'vue/no-reserved-component-names': 'error', // 禁止保留的组件名
      'vue/no-static-inline-styles': ['warn', { allowBinding: false }], // 警告内联样式
      'vue/no-unused-components': 'warn', // 警告未使用的组件
      'vue/no-unused-vars': 'warn', // 警告未使用的变量
      'vue/no-use-v-if-with-v-for': 'error', // 禁止 v-if 和 v-for 同用
      'vue/prefer-separate-static-class': 'warn', // 建议分离静态 class
      'vue/require-component-is': 'error', // <component> 需要 :is
      'vue/require-prop-types': 'error', // Props 需要类型定义
      'vue/require-v-for-key': 'error', // v-for 需要 key
      'vue/valid-define-emits': 'error',
      'vue/valid-define-props': 'error',

      // Priority C: Recommended - 可选，根据团队偏好
      'vue/attributes-order': 'warn', // 属性顺序（警告，不强制）
      'vue/component-tags-order': [
        'error',
        {
          order: [
            {
              selector: 'script',
              lang: 'ts',
            },
            'template',
            {
              selector: 'style',
              scoped: true,
            },
            {
              selector: 'style',
              scoped: false,
            },
          ],
        },
      ],
      'vue/max-attributes-per-line': 'off', // 由 Prettier 管理
      'vue/multi-word-component-names': 'off', // 插件组件允许单名
      'vue/no-multiple-template-root': 'off', // Vue 3 支持多根
      'vue/html-self-closing': 'off', // 由 Prettier 管理

      // 布局规则 - 由 Prettier 管理，关闭避免冲突
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts',
          },
        },
      ],
      'vue/html-indent': 'off',

      // Prettier 规则
      'prettier/prettier': ['warn', { usePrettierrc: true }],
    },
  },

  // 9. 测试文件环境覆盖
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
