import TaskManagerPlugin from '@/main';

let plugin: null | TaskManagerPlugin = null;

export const setPlugin = (pluginInstance: TaskManagerPlugin) => {
  plugin = pluginInstance;
};

export const usePlugin = (): TaskManagerPlugin => {
  if (!plugin) {
    throw new Error('插件未初始化');
  }
  return plugin;
};
