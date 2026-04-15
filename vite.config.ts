/* eslint-disable no-console */
import vue from '@vitejs/plugin-vue';
import fg from 'fast-glob';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import livereload from 'rollup-plugin-livereload';
import { type ConfigEnv, defineConfig, loadEnv, type UserConfig } from 'vite';
import removeConsole from 'vite-plugin-remove-console';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import zipPack from 'vite-plugin-zip-pack';

import pluginInfo from './plugin.json';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * 创建监听外部文件变化的插件(用于热重载)
 * @returns Rolldown 插件实例
 */
function createWatchExternalPlugin() {
  return {
    async buildStart(this: any) {
      const files = await fg([
        'src/i18n/*.json',
        './README*.md',
        './plugin.json',
        './preview.png',
        './icon.png',
        './LICENSE',
      ]);

      for (const file of files) {
        this.addWatchFile(file);
      }
    },

    name: 'watch-external',
  };
}

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  const { VITE_SIYUAN_WORKSPACE_PATH } = env;

  // 确定输出目录和构建模式
  const isDevMode = mode === 'development';
  const siyuanWorkspacePath = VITE_SIYUAN_WORKSPACE_PATH;

  let devDistDir = './dev';
  if (siyuanWorkspacePath) {
    console.log(`\nSiyuan workspace path:\n${siyuanWorkspacePath}`);
    devDistDir = `${siyuanWorkspacePath}/data/plugins/${pluginInfo.name}`;
  } else {
    console.warn('\n⚠️  Siyuan workspace path is not set in .env file');
  }

  const distDir = isDevMode ? devDistDir : './dist';

  console.log(`\nBuild configuration:`);
  console.log(`  Mode: ${mode}`);
  console.log(`  Dev Mode: ${isDevMode}`);
  console.log(`  Output: ${distDir}\n`);

  return {
    base: './',

    // 构建配置
    build: {
      emptyOutDir: !isDevMode,
      lib: {
        entry: resolve(__dirname, 'src/main.ts'),
        fileName: 'index',
        formats: ['cjs'],
      },
      minify: isDevMode ? false : 'oxc',
      outDir: distDir,
      rolldownOptions: {
        external: ['siyuan', 'process'],
        output: {
          assetFileNames: (assetInfo) => {
            const assetName =
              Array.isArray(assetInfo.names) && assetInfo.names.length > 0
                ? assetInfo.names[0]
                : undefined;
            if (assetName?.endsWith('.css')) {
              return 'index.css';
            }
            return assetName ?? 'assets/[name].[ext]';
          },
          // entryFileNames: '[name].js',
          entryFileNames: 'index.js',
        },
        plugins: isDevMode
          ? []
          : [
              zipPack({
                inDir: './dist',
                outDir: './build',
                outFileName: 'package.zip',
              }),
              removeConsole({
                includes: ['log', 'warn', 'error', 'info', 'debug'],
              }),
            ],
        treeshake: true,
      },
      sourcemap: false,
    },

    // 环境变量注入
    define: {
      'process.env.DEV_MODE': JSON.stringify(isDevMode),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    // 插件配置
    plugins: [
      // vue({ vapor: true }), // vue 3.6 以上版本支持
      vue(),
      viteStaticCopy({
        targets: [
          { dest: '.', src: './README*.md' },
          { dest: '.', src: './icon.png' },
          { dest: '.', src: './preview.png' },
          { dest: '.', src: './plugin.json' },
          {
            dest: './i18n',
            rename: { stripBase: 2 },
            src: './src/i18n/*.json',
          },
        ],
      }),
      // 开发模式下添加热重载插件
      ...(isDevMode ? [livereload(devDistDir), createWatchExternalPlugin()] : []),
    ],

    // 解析配置
    resolve: {
      tsconfigPaths: true,
    },
  };
});
