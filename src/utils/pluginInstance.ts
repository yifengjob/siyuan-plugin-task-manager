import TaskManagerPlugin from '@/index.ts';

let plugin: TaskManagerPlugin = null;

export const setPlugin = (pluginInstance: TaskManagerPlugin) => {
  plugin = pluginInstance;
};

export const usePlugin = (): TaskManagerPlugin => {
  if (!plugin) {
    console.error('Plugin not initialized');
  }
  return plugin;
};
