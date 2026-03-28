// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    // 1. ESLint 推荐规则
    eslint.configs.recommended,
    // 2. TypeScript 推荐规则
    ...tseslint.configs.recommended,
    // 3. 关闭与 Prettier 冲突的规则
    eslintConfigPrettier,
    // 4. 自定义配置
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            prettier,
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

            // Prettier 格式化规则（作为 ESLint 规则运行）
            'prettier/prettier': [
                'warn',
                {
                    semi: true,
                    singleQuote: true,
                    tabWidth: 4,
                    trailingComma: 'es5',
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
    // 5. 测试文件覆盖
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
