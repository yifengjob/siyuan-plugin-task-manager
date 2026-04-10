import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import fg from 'fast-glob';
import minimist from 'minimist';
import livereload from 'rollup-plugin-livereload';
import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import zipPack from 'vite-plugin-zip-pack';
import removeConsole from 'vite-plugin-remove-console';

import pluginInfo from './plugin.json';

/**
 * 创建监听外部文件变化的插件（用于热重载）
 * @returns Vite/Rolldown 插件实例
 */
function createWatchExternalPlugin() {
  return {
    name: 'watch-external',

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
  };
}

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  console.log('mode=>', mode);
  const env = loadEnv(mode, process.cwd());
  const { VITE_SIYUAN_WORKSPACE_PATH } = env;
  console.log('env=>', env);

  const siyuanWorkspacePath = VITE_SIYUAN_WORKSPACE_PATH;
  let devDistDir = './dev';
  if (!siyuanWorkspacePath) {
    console.log('\nSiyuan workspace path is not set.');
  } else {
    console.log(`\nSiyuan workspace path is set:\n${siyuanWorkspacePath}`);
    devDistDir = `${siyuanWorkspacePath}/data/plugins/${pluginInfo.name}`;
  }
  console.log(`\nPlugin will build to:\n${devDistDir}`);

  const args = minimist(process.argv.slice(2));
  const isWatch = args.watch || args.w || false;
  const distDir = isWatch ? devDistDir : './dist';

  console.log();
  console.log('isWatch=>', isWatch);
  console.log('distDir=>', distDir);

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    plugins: [
      vue(),
      viteStaticCopy({
        targets: [
          {
            src: './README*.md',
            dest: './',
          },
          {
            src: './icon.png',
            dest: './',
          },
          {
            src: './preview.png',
            dest: './',
          },
          {
            src: './plugin.json',
            dest: './',
          },
          {
            src: './src/i18n/*.json',
            dest: './i18n',
            rename: { stripBase: 2 },
          },
        ],
      }),
    ],

    define: {
      'process.env.DEV_MODE': `"${isWatch}"`,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },

    build: {
      outDir: distDir,
      emptyOutDir: !isWatch,
      sourcemap: false,
      minify: isWatch ? false : 'oxc',
      lib: {
        entry: resolve(__dirname, 'src/main.ts'),
        fileName: 'index',
        formats: ['cjs'],
      },
      rolldownOptions: {
        plugins: [
          ...(isWatch
            ? [livereload(devDistDir), createWatchExternalPlugin()]
            : [
                zipPack({
                  inDir: './dist',
                  outDir: './build',
                  outFileName: 'package.zip',
                }),
                removeConsole({
                  includes: ['log', 'warn', 'error', 'info', 'debug'],
                }),
              ]),
        ],
        external: ['siyuan', 'process'],
        treeshake: true,
        output: {
          // entryFileNames: '[name].js',
          entryFileNames: 'index.js',
          assetFileNames: (assetInfo) => {
            const assetName =
              Array.isArray(assetInfo.names) && assetInfo.names.length > 0
                ? assetInfo.names[0]
                : undefined;
            if (assetName?.endsWith('.css')) {
              return 'index.css';
            }
            if (!assetName) {
              return 'assets/[name].[ext]';
            }
            return assetName;
          },
        },
      },
    },
    base: './',
  };
});
