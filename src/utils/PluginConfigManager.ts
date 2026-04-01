// src/utils/PluginConfigManager.ts
import { Plugin } from 'siyuan';
import { PluginConfig } from '@/types';

export class PluginConfigManager {
    private plugin: Plugin;
    private config: PluginConfig = {
        defaultProgressGroup: 'incomplete',
        autoHidePopoverDelay: 3,
        filteredNotebooks: [],
        filteredBlocks: [],
        datetimeFormatPattern: 'yyyy-MM-dd HH:mm',
    };

    private unSavedConfig: PluginConfig | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async loadConfig(): Promise<void> {
        const saved = await this.plugin.loadData('config.json');
        if (saved) {
            this.config = {
                ...this.config,
                ...saved,
            };
        }
    }

    async saveConfig(): Promise<void> {
        const configToSave = this.unSavedConfig || this.config;
        this.plugin.saveData('config.json', configToSave).then(() => {
            this.config = {
                ...this.config,
                ...configToSave,
            };
            this.unSavedConfig = null;
        });
    }

    async removeConfigData(): Promise<void> {
        try {
            await this.plugin.removeData('config.json');
            console.log(`[${this.plugin.name}] 配置文件已删除`);
        } catch (error) {
            console.error(`[${this.plugin.name}] 删除配置文件失败:`, error);
            throw error;
        }
    }
    getConfig(): PluginConfig {
        return this.config;
    }

    updateConfig<K extends keyof PluginConfig>(
        key: K,
        value: PluginConfig[K]
    ): void {
        if (!this.unSavedConfig) {
            this.unSavedConfig = { ...this.config };
        }
        this.unSavedConfig[key] = value;
    }

    getUnSavedConfig(): PluginConfig | null {
        return this.unSavedConfig;
    }

    resetUnSavedConfig(): void {
        this.unSavedConfig = null;
    }
}
