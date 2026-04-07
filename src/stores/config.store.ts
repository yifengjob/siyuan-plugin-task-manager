import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import type { PluginConfig } from '@/types';

export const useConfigStore = defineStore('config', () => {
  const config = shallowRef<PluginConfig>({
    defaultProgressGroup: 'incomplete',
    autoHidePopoverDelay: 5,
    filteredNotebooks: [],
    filteredBlocks: [],
    datetimeFormatPattern: 'yyyy-MM-dd HH:mm',
  });
  function setConfig(newConfig: PluginConfig) {
    config.value = newConfig;
  }

  function updateConfig<K extends keyof PluginConfig>(
    key: K,
    value: PluginConfig[K]
  ) {
    config.value = {
      ...config.value,
      [key]: value,
    };
  }

  function getConfig(): PluginConfig {
    return config.value;
  }

  return {
    config,
    setConfig,
    updateConfig,
    getConfig,
  };
});
