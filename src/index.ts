import type { ComponentPublicInstance } from 'vue';
import type { PluginConfig, PopoverOptions } from '@/types';
import { createPinia } from 'pinia';
import { IProtyle, Plugin } from 'siyuan';
import { createApp } from 'vue';
import PluginInfoString from '@/../plugin.json';
import App from '@/App.vue';
import { taskService } from '@/services/TaskService.ts';

import {
    findTaskElement,
    getClickTargetFromEvent,
    isElementEditable,
} from '@/utils/domUtils.ts';
import { FrontendDetector } from '@/utils/FrontendDetector';
import { PluginConfigManager } from '@/utils/PluginConfigManager';
import { setPlugin } from '@/utils/pluginInstance.ts';
import { SettingsFactory } from '@/utils/SettingsFactory';
import '@/assets/index.scss';

interface PluginInfo {
    version: string;
    author: string;
}

const PLUGIN_INFO: PluginInfo = (() => {
    try {
        return PluginInfoString as PluginInfo;
    } catch (error) {
        console.error('插件信息解析错误：', error);
        return {
            version: '',
            author: '',
        };
    }
})();

export default class TaskManagerPlugin extends Plugin {
    private readonly configManager: PluginConfigManager;
    private vueApp: ReturnType<typeof createApp> | null = null;
    private mountPoint: HTMLElement | null = null;
    private appComponent: ComponentPublicInstance | null = null;

    public readonly version: string;
    public readonly author: string;
    public readonly frontendInfo: ReturnType<typeof FrontendDetector.detect>;

    constructor(context: any) {
        super(context);
        this.configManager = new PluginConfigManager(this);
        this.version = PLUGIN_INFO.version;
        this.author = PLUGIN_INFO.author;
        this.frontendInfo = FrontendDetector.detect();
    }

    async onload(): Promise<void> {
        setPlugin(this);
        await this.loadPluginConfig();
        this.setupSettings();
        await this.mountVueApp();
        this.bindEventListeners();
    }

    /**
     * 加载插件配置
     */
    private async loadPluginConfig(): Promise<void> {
        try {
            await this.configManager.loadConfig();
        } catch (error) {
            console.error('[TaskManager] 加载插件配置失败：', error);
        }
    }

    /**
     * 设置插件配置界面
     */
    private setupSettings(): void {
        try {
            const settingsFactory = new SettingsFactory(
                this.configManager,
                this.i18n
            );
            this.setting = settingsFactory.createSetting();
        } catch (error) {
            console.error('[TaskManager] 设置初始化失败：', error);
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

            this.appComponent = this.vueApp.mount(this.mountPoint);
            document.body.appendChild(this.mountPoint);
        } catch (error) {
            console.error('[TaskManager] 未能挂载Vue应用：', error);
            throw error;
        }
    }

    /**
     * 绑定事件监听器
     */
    private bindEventListeners(): void {
        this.eventBus.on(
            'click-editorcontent',
            this.handleEditorContentClick.bind(this)
        );
    }
    /**
     * 解绑事件监听器
     */
    private unbindEventListeners(): void {
        this.eventBus.off('click-editorcontent', this.handleEditorContentClick);
    }
    /**
     * 处理编辑器内容点击事件
     */
    private async handleEditorContentClick(
        eventData: CustomEvent<{ protyle: IProtyle; event: MouseEvent }>
    ): Promise<void> {
        try {
            const { targetElement, originalEvent } =
                getClickTargetFromEvent(eventData);

            if (!targetElement) {
                return;
            }

            // 点击的是任务复选框，不处理
            const originalEventTarget = originalEvent?.target as HTMLElement;
            if (
                originalEventTarget &&
                originalEventTarget.closest(
                    '.protyle-action.protyle-action--task'
                )
            ) {
                return;
            }

            const taskElement = findTaskElement(targetElement);
            if (!taskElement) {
                return;
            }

            await this.showTaskPopover(taskElement, originalEvent);
        } catch (error) {
            console.error('[TaskManager] 点击事件错误处理：', error);
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
            taskId: blockId,
            referenceEl: taskElement,
            isEditable,
            attrs,
            createdDate,
            referencePoint: originalEvent
                ? {
                      x: originalEvent.clientX,
                      y: originalEvent.clientY,
                  }
                : undefined,
        };

        if (this.appComponent && 'showPopover' in this.appComponent) {
            (this.appComponent as any).showPopover(options);
        }
    }

    onunload(): void {
        this.cleanup();
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
            console.error('[TaskManager] 清理过程中出现错误：', error);
        }
    }

    /**
     * 获取插件配置
     */
    getConfig(): PluginConfig {
        return this.configManager.getConfig();
    }
}
