<script setup lang="ts">
import type { Task } from '@/types';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { taskService } from '@/services/TaskService.ts';
import { useTaskStore } from '@/stores/tasks.store.ts';
import { usePlugin } from '@/utils/pluginInstance.ts';
import TaskItem from './TaskItem.vue';
import type { IWebSocketData } from 'siyuan';

const taskStore = useTaskStore();
const plugin = usePlugin();
const i18n = plugin.i18n;
const isLoading = ref(true);
const loadError = ref<string | null>(null);
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
// 节流控制：记录已处理的 blockId 和时间戳
const processedBlockIds = new Map<string, number>();
const THROTTLE_DELAY = 50;
const DEBOUNCED_DELAY = 50;
const MAX_CACHED_BLOCK_IDS = 1000;
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 分钟过期

// 过滤状态：'all', 'completed', 'incomplete'
const filterStatus = ref<'all' | 'completed' | 'incomplete' | string>(
    plugin.getConfig().defaultProgressGroup
);

// 获取所有任务（原始数据）
const allTasks = computed(() => taskStore.tasks);

// 根据过滤状态筛选任务
const filteredTasks = computed(() => {
    if (filterStatus.value === 'all') return allTasks.value;
    if (filterStatus.value === 'completed') {
        return allTasks.value.filter((task) => task.attrs.completed === true);
    }
    return allTasks.value.filter((task) => task.attrs.completed !== true);
});

// 定期清理过期缓存
const cleanupExpiredCache = () => {
    const now = Date.now();
    for (const [blockId, timestamp] of processedBlockIds.entries()) {
        if (now - timestamp > CACHE_EXPIRY_TIME) {
            processedBlockIds.delete(blockId);
        }
    }
};

// 重新计算分组（基于过滤后的任务）
const groups = computed(() => {
    const map = new Map<
        string,
        { rootTitle: string; rootPath: string; tasks: Task[] }
    >();
    filteredTasks.value.forEach((task) => {
        // 使用 rootId 作为分组 key，确保不同文档即使标题相同也不会混淆
        const rootId = task.rootId;

        if (!map.has(rootId)) {
            map.set(rootId, {
                rootTitle:
                    task.rootTitle !== ''
                        ? task.rootTitle
                        : plugin.i18n.untitled,
                rootPath: task.hpath,
                tasks: [],
            });
        }
        map.get(rootId)!.tasks.push(task);
    });

    return Array.from(map.entries()).map(([rootId, data]) => ({
        rootId,
        ...data,
    }));
});

// 统计数据
const totalTasks = computed(() => allTasks.value.length);
const completedTasks = computed(
    () => allTasks.value.filter((t) => t.attrs.completed === true).length
);
const incompleteTasks = computed(() => totalTasks.value - completedTasks.value);

const onTaskClick = async (task: Task) => {
    const id = task.id;
    if (id) {
        try {
            await taskService.openTask(id);
        } catch (error) {
            console.error('[TaskManager] 未打开任务：', error);
        }
    }
};

const toggleCompleted = async (taskId: string, completed: boolean) => {
    try {
        await taskStore.toggleTaskStatus(taskId, completed);
    } catch (error) {
        console.error('[TaskManager] 未能切换任务完成：', error);
    }
};

// 手动刷新任务
const handleRefresh = async () => {
    try {
        isLoading.value = true;
        loadError.value = null;
        await taskStore.loadTasks();
    } catch (error) {
        console.error('手动刷新失败：', error);
        loadError.value = '刷新失败，请稍后重试';
    } finally {
        isLoading.value = false;
    }
};

// 防抖刷新函数（用于 ws-main 事件）
const debouncedRefresh = async () => {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }
    return new Promise<void>((resolve, reject) => {
        refreshTimer = setTimeout(async () => {
            try {
                loadError.value = null;
                await taskStore.loadTasks();
                resolve();
            } catch (error) {
                console.error('任务刷新失败：', error);
                loadError.value = '刷新失败，请稍后重试';
                reject(error);
            } finally {
                refreshTimer = null;
            }
        }, DEBOUNCED_DELAY);
    });
};

const handleWsMain = async (event: CustomEvent<IWebSocketData>) => {
    const detail = event.detail;
    if (!detail) return;

    const supportedCommands = [
        'removeDoc',
        'create',
        'moveDoc',
        'rename',
        'copyDoc',
    ];
    if (detail.cmd && supportedCommands.includes(detail.cmd)) {
        await debouncedRefresh();
        return;
    }

    if (detail.cmd && detail.cmd !== 'transactions') {
        return;
    }
    if (!detail.data || !Array.isArray(detail.data)) return;
    let needsRefresh = false;
    const supportedActions = ['update', 'delete', 'insert', 'move', 'save'];

    try {
        for (const item of detail.data) {
            if (!item.doOperations || !Array.isArray(item.doOperations))
                continue;

            for (const op of item.doOperations) {
                if (!op.action || !supportedActions.includes(op.action))
                    continue;

                if (
                    op.action === 'update' &&
                    op.data &&
                    op.data.startsWith(
                        '<div data-marker="*" data-subtype="t" data-node-id="'
                    ) &&
                    op.data.includes('data-subtype="t"') &&
                    op.data.includes('data-type="NodeListItem"')
                ) {
                    const blockId = op.id;
                    if (!blockId) continue;

                    const now = Date.now();
                    const lastProcessedTime =
                        processedBlockIds.get(blockId) || 0;
                    if (now - lastProcessedTime < THROTTLE_DELAY) {
                        continue;
                    }
                    const taskCompleted = op.data.includes(
                        `class="li protyle-task--done"`
                    );

                    processedBlockIds.set(blockId, now);
                    if (processedBlockIds.size > MAX_CACHED_BLOCK_IDS) {
                        const firstKey = processedBlockIds.keys().next().value;
                        if (firstKey) processedBlockIds.delete(firstKey);
                    }
                    // 每 100 次操作清理一次过期缓存
                    if (processedBlockIds.size % 100 === 0) {
                        cleanupExpiredCache();
                    }

                    await taskStore.syncTaskStatus(blockId, taskCompleted);
                    continue;
                }

                needsRefresh = true;
            }
        }

        if (needsRefresh) {
            await debouncedRefresh().catch((error) => {
                console.error('[TaskManager] 防抖刷新失败：', error);
            });
        }
    } catch (error) {
        console.error('[TaskManager] handleWsMain 错误：', error);
    }
};

onMounted(async () => {
    try {
        isLoading.value = true;
        loadError.value = null;
        await taskStore.loadTasks();
    } catch (error) {
        console.error('✗ Failed to load tasks:', error);
        loadError.value = '加载任务失败，请刷新重试';
    } finally {
        isLoading.value = false;
    }
    plugin.eventBus.on('ws-main', handleWsMain);
});

onUnmounted(() => {
    plugin.eventBus.off('ws-main', handleWsMain);
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
    processedBlockIds.clear();
});
</script>

<template>
    <div class="task-sidebar">
        <!-- 顶部工具栏 -->
        <div class="task-sidebar-toolbar">
            <div class="task-filter-group">
                <label class="task-filter-radio">
                    <input
                        type="radio"
                        value="incomplete"
                        v-model="filterStatus"
                    />
                    <span>{{ i18n.inProgress ?? '未完成' }}</span>
                </label>
                <label class="task-filter-radio">
                    <input
                        type="radio"
                        value="completed"
                        v-model="filterStatus"
                    />
                    <span>{{ i18n.completed ?? '已完成' }}</span>
                </label>
                <label class="task-filter-radio">
                    <input type="radio" value="all" v-model="filterStatus" />
                    <span>{{ i18n.all ?? '全部' }}</span>
                </label>
            </div>
            <button
                class="task-refresh-btn b3-button b3-button--text"
                @click="handleRefresh"
                :title="i18n.refresh ?? '刷新'"
            >
                <svg class="icon"><use xlink:href="#iconRefresh"></use></svg>
            </button>
        </div>

        <!-- 内容区域 -->
        <div class="task-sidebar-content">
            <div v-if="isLoading" class="task-sidebar-loading">
                {{ i18n.loading ?? '加载中...' }}
            </div>
            <div v-else-if="loadError" class="task-sidebar-error">
                {{ loadError }}
            </div>
            <div
                v-else-if="filteredTasks.length === 0"
                class="task-sidebar-empty"
            >
                {{ i18n.noTasks ?? '暂无任务' }}
            </div>
            <div v-else>
                <div
                    v-for="group in groups"
                    :key="group.rootId"
                    class="task-doc-group"
                >
                    <div class="task-doc-title" :title="group.rootPath">
                        {{ group.rootTitle }}
                    </div>
                    <TaskItem
                        v-for="task in group.tasks"
                        :key="task.id"
                        :task="task"
                        @click="onTaskClick"
                        @toggle-completed="toggleCompleted"
                    />
                </div>
            </div>
        </div>

        <!-- 底部状态栏 -->
        <div class="task-sidebar-footer">
            <span class="task-stat"
                >{{ i18n.inProgress ?? '进行中' }}：{{ incompleteTasks }}</span
            >
            <span class="task-stat"
                >{{ i18n.completed ?? '已完成' }}：{{ completedTasks }}</span
            >
            <span class="task-stat"
                >{{ i18n.totalTasks ?? '总任务' }}：{{ totalTasks }}</span
            >
        </div>
    </div>
</template>

<style scoped lang="scss">
.task-sidebar {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    font-family: var(--b3-font-family), serif;
    box-sizing: border-box;

    // 顶部工具栏
    .task-sidebar-toolbar {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--b3-toolbar-background);
        color: var(--b3-toolbar-color);
        border-bottom: 1px solid var(--b3-border-color);
        gap: 12px;
    }

    .task-filter-group {
        display: flex;
        gap: 2px;
        background: var(--b3-theme-background);
        border-radius: 30px;
        padding: 2px 4px;
        border: 1px solid var(--b3-border-color);
    }

    .task-filter-radio {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 30px;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 13px;
        color: var(--b3-theme-on-surface);

        &:hover {
            background: var(--b3-theme-surface);
        }

        input {
            margin: 0;
            width: 14px;
            height: 14px;
            accent-color: var(--b3-theme-primary);
            cursor: pointer;
        }

        span {
            line-height: 1.2;
        }
    }

    .task-refresh-btn {
        padding: 4px 8px;
        min-width: auto;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--b3-theme-on-surface);

        .icon {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }

        &:hover {
            background: var(--b3-theme-surface);
            color: var(--b3-theme-primary);
        }
    }

    // 内容区域（可滚动）
    .task-sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px 8px;
    }

    .task-sidebar-loading,
    .task-sidebar-error,
    .task-sidebar-empty {
        text-align: center;
        padding: 32px;
        color: var(--b3-theme-on-surface);
        font-size: 14px;
    }

    .task-sidebar-error {
        color: var(--b3-theme-danger);
    }

    .task-doc-group {
        margin-bottom: 24px;
    }

    .task-doc-title {
        font-weight: 600;
        font-size: 14px;
        padding: 6px 10px;
        background: var(--b3-theme-surface);
        border-radius: 8px;
        margin-bottom: 8px;
        color: var(--b3-theme-on-surface);
        border-left: 3px solid var(--b3-theme-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    // 底部状态栏
    .task-sidebar-footer {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--b3-toolbar-background);
        color: var(--b3-toolbar-color);
        border-top: 1px solid var(--b3-border-color);
        font-size: 12px;
        gap: 6px;

        .task-stat {
            flex: 1;
            text-align: center;

            &:first-child {
                text-align: left;
            }
            &:last-child {
                text-align: right;
            }
        }
    }
}
</style>
