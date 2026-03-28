// src/utils/PluginConfigManager.ts
import { Plugin } from 'siyuan';
import { PluginConfig } from '@/types';

export class PluginConfigManager {
    private plugin: Plugin;
    private config: PluginConfig = {
        defaultProgressGroup: 'incomplete',
        addAutoHidePopoverDelay: 3,
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
