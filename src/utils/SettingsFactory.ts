// src/utils/SettingsFactory.ts
import { Setting } from 'siyuan';
import { App, createApp } from 'vue';

import DocTreeSelector from '@/components/DocTreeSelector.vue';
import { useTaskStore } from '@/stores/tasks.store';
import { I18n, PluginConfig, RadioGroupOption } from '@/types';

import { PluginConfigManager } from './PluginConfigManager';

/**
 * 插件设置工厂类
 *
 * @remarks
 * 负责任务管理器的所有配置项的创建和管理
 * 包括:
 * - 自动隐藏弹窗延迟
 * - 默认进度分组
 * - 日期时间格式
 * - 任务过滤(文档树选择)
 */
export class SettingsFactory {
  private readonly configManager: PluginConfigManager;
  private readonly i18n: I18n;
  private setting!: Setting;
  private vueApps: Map<HTMLElement, App> = new Map(); // 存储容器与应用的映射

  constructor(configManager: PluginConfigManager, i18n: I18n) {
    this.configManager = configManager;
    this.i18n = i18n;
  }

  createSetting(): Setting {
    this.setting = new Setting({
      confirmCallback: async () => {
        await this.configManager.saveConfig();
        // 保存配置后刷新任务列表
        const taskStore = useTaskStore();
        await taskStore.loadTasks();
      },
      destroyCallback: async () => {
        await this.configManager.loadConfig();
        this.configManager.resetUnSavedConfig();
        this.destroyAllVueApps(); // 清理所有挂载的 Vue 应用
      },
    });

    this.addAutoHidePopoverDelaySetting();
    this.addDefaultProgressGroupSetting();
    this.addDatetimeFormatPatternSetting();
    this.addVirtualScrollThresholdSetting();
    this.addTaskFilterSetting();

    return this.setting;
  }

  /**
   * 自动隐藏弹窗延迟设置
   */
  private addAutoHidePopoverDelaySetting(): void {
    this.setting.addItem({
      createActionElement: () =>
        this.createInput(
          'autoHidePopoverDelay',
          String(this.configManager.getConfig().autoHidePopoverDelay),
          'number',
          100,
          0,
          50,
          1
        ),
      description: this.i18n.autoHidePopoverDelayDesc,
      direction: 'row',
      title: this.i18n.autoHidePopoverDelayTitle,
    });
  }

  private addDatetimeFormatPatternSetting(): void {
    this.setting.addItem({
      createActionElement: () =>
        this.createInput(
          'datetimeFormatPattern',
          this.configManager.getConfig().datetimeFormatPattern,
          'text',
          200
        ),
      description: this.i18n.datetimeFormatPatternDesc,
      direction: 'row',
      title: this.i18n.datetimeFormatPatternTitle,
    });
  }

  /**
   * 默认进度分组设置
   */
  private addDefaultProgressGroupSetting(): void {
    this.setting.addItem({
      createActionElement: () =>
        this.createRadioGroup('defaultProgressGroup', [
          {
            checked: this.configManager.getConfig().defaultProgressGroup === 'all',
            label: this.i18n.all,
            value: 'all',
          },
          {
            checked: this.configManager.getConfig().defaultProgressGroup === 'completed',
            label: this.i18n.completed,
            value: 'completed',
          },
          {
            checked: this.configManager.getConfig().defaultProgressGroup === 'incomplete',
            label: this.i18n.inProgress,
            value: 'incomplete',
          },
        ]),
      description: this.i18n.defaultProgressGroupDesc,
      direction: 'row',
      title: this.i18n.defaultProgressGroupTitle,
    });
  }

  /**
   * 新增：任务过滤器设置（文档树复选框）
   * 创建容器并挂载 Vue 组件，清理工作由 destroyCallback 完成
   */
  private addTaskFilterSetting(): void {
    this.setting.addItem({
      createActionElement: () => {
        const container = document.createElement('div');
        container.className = 'task-filter-tree-container';
        // 创建 Vue 应用并挂载
        const app = createApp(DocTreeSelector, {
          configManager: this.configManager,
          i18n: this.i18n,
        });
        app.mount(container);
        this.vueApps.set(container, app);
        // 注意：不需要额外的 MutationObserver，因为 destroyCallback 会清理所有挂载的应用
        return container;
      },
      description: this.i18n.filterSettingsDesc,
      direction: 'row',
      title: this.i18n.filterSettingsTitle,
    });
  }

  /**
   * 虚拟滚动阈值设置
   */
  private addVirtualScrollThresholdSetting(): void {
    this.setting.addItem({
      createActionElement: () =>
        this.createInput(
          'virtualScrollThreshold',
          String(this.configManager.getConfig().virtualScrollThreshold),
          'number',
          100,
          0,
          1000,
          5
        ),
      description: this.i18n.virtualScrollThresholdDesc,
      direction: 'row',
      title: this.i18n.virtualScrollThresholdTitle,
    });
  }

  /**
   * 通用输入框创建方法
   */
  private createInput(
    key: string,
    value: string,
    inputType: 'email' | 'number' | 'password' | 'tel' | 'text' | 'url' = 'text',
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
      let finalValue: number | string = input.value;

      if (inputType === 'number') {
        const parsedValue = parseInt(input.value, 10);
        if (isNaN(parsedValue)) {
          input.value = value;
          return;
        }
        finalValue = Math.min(Math.max(parsedValue, min), max);
        input.value = String(finalValue);
      }

      this.configManager.updateConfig(key as keyof PluginConfig, finalValue);
    });
    return input;
  }

  /**
   * 单选按钮组创建方法
   */
  private createRadioGroup(key: keyof PluginConfig, options: RadioGroupOption[]): HTMLDivElement {
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

  /**
   * 销毁所有已挂载的 Vue 应用（用于设置面板销毁时的清理）
   */
  private destroyAllVueApps(): void {
    for (const [container, app] of this.vueApps.entries()) {
      app?.unmount();
      container?.remove();
    }
    this.vueApps.clear();
  }
}
