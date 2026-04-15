// 引入 vue-virtual-scroller 样式
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

import '@/assets/index.scss';

import type { App as SiyuanApp } from 'siyuan';

import { createPinia } from 'pinia';
import { IObject, IProtyle, Plugin } from 'siyuan';
import { createApp } from 'vue';

import type { AppComponent, PluginConfig, PopoverOptions } from '@/types';

import PluginInfoString from '@/../plugin.json';
import App from '@/App.vue';
import { taskService } from '@/services/TaskService';
import {
  findTaskElement,
  FrontendDetector,
  getClickTargetFromEvent,
  handleError,
  isElementEditable,
  PluginConfigManager,
  setPlugin,
  SettingsFactory,
} from '@/utils';

interface PluginInfo {
  author: string;
  version: string;
}

const PLUGIN_INFO: PluginInfo = (() => {
  try {
    return PluginInfoString as PluginInfo;
  } catch (error) {
    handleError(error, { context: 'PluginInfoParse' }, false);
    return {
      author: '',
      version: '',
    };
  }
})();

/**
 * 插件主类
 */
export default class TaskManagerPlugin extends Plugin {
  public readonly author: string;
  public readonly frontendInfo: ReturnType<typeof FrontendDetector.detect>;
  public readonly version: string;
  private appComponent: AppComponent | null = null;

  private readonly configManager: PluginConfigManager;
  private mountPoint: HTMLElement | null = null;
  private vueApp: null | ReturnType<typeof createApp> = null;

  constructor(options: { app: SiyuanApp; i18n: IObject; name: string }) {
    super(options);
    this.configManager = new PluginConfigManager(this);
    this.version = PLUGIN_INFO.version;
    this.author = PLUGIN_INFO.author;
    this.frontendInfo = FrontendDetector.detect();
  }

  /**
   * 获取插件配置
   */
  getConfig(): PluginConfig {
    return this.configManager.getConfig();
  }

  /**
   * 插件加载时的初始化入口
   *
   * 按顺序执行以下初始化步骤：
   * 1. 注册插件实例到全局工具模块
   * 2. 挂载 Vue 应用并初始化 Pinia 状态管理
   * 3. 加载插件配置（依赖已就绪的 Store）
   * 4. 创建插件设置界面
   * 5. 绑定编辑器事件监听器
   */
  async onload(): Promise<void> {
    setPlugin(this);
    // 先挂载 Vue 应用，初始化 Pinia 和 Store
    await this.mountVueApp();
    // 然后加载配置，此时 Store 已就绪
    await this.loadPluginConfig();
    // 设置插件配置界面
    this.setupSettings();
    // 绑定事件监听器
    this.bindEventListeners();
  }

  /**
   * 插件卸载时的清理入口
   *
   * 调用 cleanup 方法释放所有运行时资源
   */
  onunload(): void {
    this.cleanup();
  }

  /**
   * 卸载插件时的清理操作
   *
   * 执行以下清理步骤：
   * 1. 清理 Vue 应用、DOM 节点和事件监听器等运行时资源
   * 2. 移除插件配置数据
   *
   * @throws {Error} 卸载失败时抛出错误
   */
  async uninstall(): Promise<void> {
    try {
      this.cleanup();
      await this.configManager.removeConfigData();
    } catch (error) {
      handleError(error, { context: 'PluginUninstall' });
      throw error;
    }
  }

  /**
   * 绑定事件监听器
   */
  private bindEventListeners(): void {
    this.eventBus.on('click-editorcontent', this.handleEditorContentClick.bind(this));
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    try {
      this.vueApp?.unmount();
      this.vueApp = null;

      this.mountPoint?.remove();
      this.mountPoint = null;

      this.appComponent = null;
      this.unbindEventListeners();
    } catch (error) {
      handleError(error, { context: 'Cleanup' }, false);
    }
  }

  /**
   * 处理编辑器内容点击事件
   */
  private async handleEditorContentClick(
    eventData: CustomEvent<{ event: MouseEvent; protyle: IProtyle }>
  ): Promise<void> {
    try {
      const { originalEvent, targetElement } = getClickTargetFromEvent(eventData);

      if (!targetElement) {
        return;
      }

      // 点击的是任务复选框，不处理
      const originalEventTarget = originalEvent?.target as HTMLElement;
      if (
        originalEventTarget &&
        originalEventTarget.closest('.protyle-action.protyle-action--task')
      ) {
        return;
      }

      const taskElement = findTaskElement(targetElement);
      if (!taskElement) {
        return;
      }

      // 阻止事件冒泡到 document，防止 Popover 被关闭
      if (originalEvent) {
        originalEvent.stopPropagation();
      }

      await this.showTaskPopover(taskElement, originalEvent);
    } catch (error) {
      handleError(error, { context: 'HandleEditorClick' }, false);
    }
  }

  /**
   * 加载插件配置
   */
  private async loadPluginConfig(): Promise<void> {
    try {
      await this.configManager.loadConfig();
    } catch (error) {
      handleError(error, { context: 'LoadPluginConfig' }, false);
    }
  }

  /**
   * 挂载 Vue 应用
   */
  private async mountVueApp(): Promise<void> {
    try {
      this.mountPoint = document.createElement('div');
      this.mountPoint.classList.add('plugin-boilerplate-vite-vue-app');

      const pinia = createPinia();
      this.vueApp = createApp(App);
      this.vueApp.use(pinia);

      this.appComponent = this.vueApp.mount(this.mountPoint) as AppComponent;
      document.body.appendChild(this.mountPoint);
    } catch (error) {
      handleError(error, { context: 'MountVueApp' });
      throw error;
    }
  }

  /**
   * 设置插件配置界面
   */
  private setupSettings(): void {
    try {
      const settingsFactory = new SettingsFactory(this.configManager, this.i18n);
      this.setting = settingsFactory.createSetting();
    } catch (error) {
      handleError(error, { context: 'SetupSettings' }, false);
    }
  }

  /**
   * 显示任务 Popover
   */
  private async showTaskPopover(
    taskElement: HTMLElement,
    originalEvent: MouseEvent | null
  ): Promise<void> {
    const blockId = taskElement.getAttribute('data-node-id');
    if (!blockId) return;

    const [attrs, createdDate, isEditable] = await Promise.all([
      taskService.getTaskAttrs(blockId),
      taskService.getBlockCreated(blockId),
      Promise.resolve(isElementEditable(taskElement)),
    ]);

    const options: PopoverOptions = {
      attrs,
      createdDate,
      isEditable,
      offset: 30,
      placement: 'top',
      referenceEl: taskElement,
      referencePoint: originalEvent
        ? {
            x: originalEvent.clientX,
            y: originalEvent.clientY,
          }
        : undefined,
      taskId: blockId,
    };

    if (this.appComponent && 'showPopover' in this.appComponent) {
      this.appComponent.showPopover(options);
    }
  }

  /**
   * 解绑事件监听器
   */
  private unbindEventListeners(): void {
    this.eventBus.off('click-editorcontent', this.handleEditorContentClick);
  }
}
