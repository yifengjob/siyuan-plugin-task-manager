import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

import type { PluginConfig } from '@/types';

import { DEFAULT_CONFIG } from '@/constants';

export const useConfigStore = defineStore('config', () => {
  const config = shallowRef<PluginConfig>(DEFAULT_CONFIG);
  function setConfig(newConfig: PluginConfig) {
    config.value = newConfig;
  }

  function updateConfig<K extends keyof PluginConfig>(key: K, value: PluginConfig[K]) {
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
    getConfig,
    setConfig,
    updateConfig,
  };
});
