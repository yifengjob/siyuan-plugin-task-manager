// src/utils/SettingsFactory.ts
import { Setting } from 'siyuan';
import { PluginConfigManager } from './PluginConfigManager';
import { I18n, PluginConfig, RadioGroupOption } from '@/types';

export class SettingsFactory {
    private setting: Setting;
    private configManager: PluginConfigManager;
    private i18n: I18n;

    constructor(configManager: PluginConfigManager, i18n: I18n) {
        this.configManager = configManager;
        this.i18n = i18n;
    }

    createSetting(): Setting {
        this.setting = new Setting({
            confirmCallback: async () => await this.configManager.saveConfig(),
            destroyCallback: () => this.configManager.resetUnSavedConfig(),
        });

        this.addAutoHidePopoverDelaySetting();
        this.addDefaultProgressGroupSetting();

        return this.setting;
    }

    private addAutoHidePopoverDelaySetting(): void {
        this.setting.addItem({
            title: this.i18n.autoHidePopoverDelayTitle,
            description: this.i18n.autoHidePopoverDelayDesc,
            direction: 'row',
            createActionElement: () =>
                this.createInput(
                    'addAutoHidePopoverDelay',
                    String(
                        this.configManager.getConfig().addAutoHidePopoverDelay
                    ),
                    'number',
                    100,
                    0,
                    50,
                    1
                ),
        });
    }
    private addDefaultProgressGroupSetting(): void {
        this.setting.addItem({
            title: this.i18n.defaultProgressGroupTitle,
            description: this.i18n.defaultProgressGroupDesc,
            direction: 'row',
            createActionElement: () =>
                this.createRadioGroup('defaultProgressGroup', [
                    {
                        label: this.i18n.all,
                        value: 'all',
                        checked:
                            this.configManager.getConfig()
                                .defaultProgressGroup === 'all',
                    },
                    {
                        label: this.i18n.completed,
                        value: 'completed',
                        checked:
                            this.configManager.getConfig()
                                .defaultProgressGroup === 'completed',
                    },
                    {
                        label: this.i18n.inProgress,
                        value: 'incomplete',
                        checked:
                            this.configManager.getConfig()
                                .defaultProgressGroup === 'incomplete',
                    },
                ]),
        });
    }

    // private createCheckbox(
    //     key: keyof PluginConfig,
    //     checked: boolean
    // ): HTMLInputElement {
    //     const input = document.createElement('input');
    //     input.type = 'checkbox';
    //     input.className = 'b3-switch';
    //     input.checked = checked;
    //     input.addEventListener('change', () => {
    //         this.configManager.updateConfig(key, input.checked);
    //     });
    //     return input;
    // }

    private createInput(
        key: string,
        value: string,
        inputType:
            | 'text'
            | 'number'
            | 'password'
            | 'email'
            | 'tel'
            | 'url' = 'text',
        width: number = 100,
        min: number = -Number.MAX_SAFE_INTEGER,
        max: number = Number.MAX_SAFE_INTEGER,
        step: number = 1
    ): HTMLInputElement {
        const input = document.createElement('input');
        input.type = inputType;
        input.className = 'b3-text-field';
        input.value = value;
        input.style.width = `${width}px`;

        if (inputType === 'number') {
            input.step = String(step);
            input.min = String(min);
            input.max = String(max);
        }

        input.addEventListener('change', () => {
            let finalValue: string | number = input.value;

            if (inputType === 'number') {
                const parsedValue = parseInt(input.value, 10);
                if (isNaN(parsedValue)) {
                    input.value = value;
                    return;
                }
                finalValue = Math.min(Math.max(parsedValue, min), max);
                input.value = String(finalValue);
            }

            this.configManager.updateConfig(
                key as keyof PluginConfig,
                finalValue
            );
        });
        return input;
    }

    private createRadioGroup(
        key: keyof PluginConfig,
        options: RadioGroupOption[]
    ): HTMLDivElement {
        const groups = document.createElement('div');
        groups.style.display = 'flex';
        groups.style.flexDirection = 'row';
        groups.style.gap = '16px';
        groups.style.justifyItems = 'stretch';
        groups.style.alignItems = 'center';
        options.forEach((option) => {
            const group = document.createElement('div');
            group.style.display = 'inline-flex';
            group.style.flexDirection = 'row';
            group.style.gap = '8px';
            group.style.justifyItems = 'stretch';
            group.style.alignItems = 'center';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = key;
            input.className = 'b3-radio';
            input.value = String(option.value);
            input.checked = option.checked;
            input.addEventListener('change', () => {
                this.configManager.updateConfig(key, input.value);
            });
            group.appendChild(input);
            group.appendChild(document.createTextNode(option.label));
            groups.appendChild(group);
        });
        return groups;
    }
}
