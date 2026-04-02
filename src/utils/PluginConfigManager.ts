import { Plugin } from 'siyuan';
import { PluginConfig } from '@/types';
import { useConfigStore } from '@/stores/config.store';

export class PluginConfigManager {
  private plugin: Plugin;
  private configStore: ReturnType<typeof useConfigStore> | null = null;
  private unSavedConfig: PluginConfig | null = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  private getConfigStore(): ReturnType<typeof useConfigStore> {
    if (!this.configStore) {
      this.configStore = useConfigStore();
    }
    return this.configStore;
  }

  async loadConfig(): Promise<void> {
    const saved = await this.plugin.loadData('config.json');
    if (saved) {
      const mergedConfig = {
        defaultProgressGroup: 'incomplete',
        autoHidePopoverDelay: 3,
        filteredNotebooks: [],
        filteredBlocks: [],
        datetimeFormatPattern: 'yyyy-MM-dd HH:mm',
        ...saved,
      };
      this.getConfigStore().setConfig(mergedConfig);
    }
  }

  async saveConfig(): Promise<void> {
    const configToSave =
      this.unSavedConfig || this.getConfigStore().getConfig();
    this.plugin.saveData('config.json', configToSave).then(() => {
      this.getConfigStore().setConfig(configToSave);
      this.unSavedConfig = null;
    });
  }

  async removeConfigData(): Promise<void> {
    try {
      await this.plugin.removeData('config.json');
    } catch (error) {
      console.error(`[${this.plugin.name}] 删除配置文件失败：`, error);
      throw error;
    }
  }

  getConfig(): PluginConfig {
    const store = this.configStore;
    if (!store) {
      // 如果 store 还未初始化，返回默认配置
      return {
        defaultProgressGroup: 'incomplete',
        autoHidePopoverDelay: 5,
        filteredNotebooks: [],
        filteredBlocks: [],
        datetimeFormatPattern: 'yyyy-MM-dd HH:mm',
      };
    }
    return store.getConfig();
  }

  updateConfig<K extends keyof PluginConfig>(
    key: K,
    value: PluginConfig[K]
  ): void {
    const currentConfig = this.configStore
      ? this.configStore.getConfig()
      : {
          defaultProgressGroup: 'incomplete',
          autoHidePopoverDelay: 3,
          filteredNotebooks: [],
          filteredBlocks: [],
          datetimeFormatPattern: 'yyyy-MM-dd HH:mm',
        };

    if (!this.unSavedConfig) {
      this.unSavedConfig = { ...currentConfig };
    }
    this.unSavedConfig[key] = value;

    // 如果 store 已初始化，同时更新它
    if (this.configStore) {
      this.configStore.updateConfig(key, value);
    }
  }

  getUnSavedConfig(): PluginConfig | null {
    return this.unSavedConfig;
  }

  resetUnSavedConfig(): void {
    this.unSavedConfig = null;
  }
}
