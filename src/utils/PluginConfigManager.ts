import { Plugin } from 'siyuan';

import { DEFAULT_CONFIG } from '@/constants';
import { useConfigStore } from '@/stores/config.store';
import { PluginConfig } from '@/types';

import { handleError } from './ErrorHandler';

export class PluginConfigManager {
  private configStore: null | ReturnType<typeof useConfigStore> = null;
  private plugin: Plugin;
  private unSavedConfig: null | PluginConfig = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  getConfig(): PluginConfig {
    const store = this.configStore;
    if (!store) {
      // 如果 store 还未初始化，返回默认配置
      return DEFAULT_CONFIG;
    }
    return store.getConfig();
  }

  getUnSavedConfig(): null | PluginConfig {
    return this.unSavedConfig;
  }

  async loadConfig(): Promise<void> {
    const saved = await this.plugin.loadData('config.json');
    if (saved) {
      const mergedConfig = {
        ...DEFAULT_CONFIG,
        ...saved,
      };
      this.getConfigStore().setConfig(mergedConfig);
    }
  }

  async removeConfigData(): Promise<void> {
    try {
      await this.plugin.removeData('config.json');
    } catch (error) {
      handleError(error, { context: 'RemoveConfigData' });
      throw error;
    }
  }

  resetUnSavedConfig(): void {
    this.unSavedConfig = null;
  }

  async saveConfig(): Promise<void> {
    const configToSave = this.unSavedConfig || this.getConfigStore().getConfig();
    await this.plugin.saveData('config.json', configToSave);
    this.getConfigStore().setConfig(configToSave);
    this.unSavedConfig = null;
  }

  updateConfig<K extends keyof PluginConfig>(key: K, value: PluginConfig[K]): void {
    const currentConfig = this.configStore ? this.configStore.getConfig() : DEFAULT_CONFIG;

    if (!this.unSavedConfig) {
      this.unSavedConfig = { ...currentConfig };
    }
    this.unSavedConfig[key] = value;

    // 如果 store 已初始化，同时更新它
    if (this.configStore) {
      this.configStore.updateConfig(key, value);
    }
  }

  private getConfigStore(): ReturnType<typeof useConfigStore> {
    if (!this.configStore) {
      this.configStore = useConfigStore();
    }
    return this.configStore;
  }
}
