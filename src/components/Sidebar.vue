<script setup lang="ts">
import type { Task } from '@/types';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { taskService } from '@/services/TaskService.ts';
import { useTaskStore } from '@/stores/tasks.store.ts';
import { usePlugin } from '@/utils/pluginInstance.ts';
import TaskItem from './TaskItem.vue';
import type { IWebSocketData } from 'siyuan';
import {
  computePosition,
  autoUpdate,
  offset,
  shift,
  flip,
  arrow as arrowMiddleware,
} from '@floating-ui/dom';

const taskStore = useTaskStore();
const plugin = usePlugin();
const i18n = plugin.i18n;
const isLoading = ref(true);
const loadError = ref<string | null>(null);
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const processedBlockIds = new Map<string, number>();
const THROTTLE_DELAY = 50;
const DEBOUNCED_DELAY = 50;
const MAX_CACHED_BLOCK_IDS = 1000;
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

const filterStatus = ref<'all' | 'completed' | 'incomplete' | string>(
  plugin.getConfig().defaultProgressGroup
);

const allTasks = computed(() => taskStore.tasks);

const filteredTasks = computed(() => {
  if (filterStatus.value === 'all') return allTasks.value;
  if (filterStatus.value === 'completed') {
    return allTasks.value.filter((task) => task.attrs.completed === true);
  }
  return allTasks.value.filter((task) => task.attrs.completed !== true);
});

const cleanupExpiredCache = () => {
  const now = Date.now();
  for (const [blockId, timestamp] of processedBlockIds.entries()) {
    if (now - timestamp > CACHE_EXPIRY_TIME) {
      processedBlockIds.delete(blockId);
    }
  }
};

const groups = computed(() => {
  const map = new Map<
    string,
    { rootTitle: string; rootPath: string; boxTitle: string; tasks: Task[] }
  >();
  filteredTasks.value.forEach((task) => {
    const rootId = task.rootId;
    if (!map.has(rootId)) {
      map.set(rootId, {
        rootTitle:
          task.rootTitle !== '' ? task.rootTitle : plugin.i18n.untitled,
        rootPath: task.hpath,
        boxTitle: task.boxTitle !== '' ? task.boxTitle : plugin.i18n.untitled,
        tasks: [],
      });
    }
    map.get(rootId)?.tasks.push(task);
  });
  return Array.from(map.entries()).map(([rootId, data]) => ({
    rootId,
    ...data,
  }));
});

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
      if (!item.doOperations || !Array.isArray(item.doOperations)) continue;

      for (const op of item.doOperations) {
        if (!op.action || !supportedActions.includes(op.action)) continue;

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
          const lastProcessedTime = processedBlockIds.get(blockId) || 0;
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

// ============ Tooltip 功能 ==========
let tooltipElement: HTMLDivElement | null = null;
let cleanupAutoUpdate: (() => void) | null = null;

const createTooltip = (reference: HTMLElement, content: string) => {
  destroyTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'task-sidebar-tooltip';
  tooltip.textContent = content;
  document.body.appendChild(tooltip);

  const arrow = document.createElement('div');
  arrow.className = 'task-sidebar-tooltip-arrow';
  tooltip.appendChild(arrow);

  tooltipElement = tooltip;

  cleanupAutoUpdate = autoUpdate(
    reference,
    tooltip,
    () => {
      computePosition(reference, tooltip, {
        placement: 'left',
        middleware: [
          offset(8),
          flip(),
          shift({ padding: 8 }),
          arrowMiddleware({ element: arrow, padding: 4 }),
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        Object.assign(tooltip.style, {
          left: `${x}px`,
          top: `${y}px`,
        });

        if (middlewareData.arrow) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow;
          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
          }[placement.split('-')[0]];
          Object.assign(arrow.style, {
            left: arrowX !== null ? `${arrowX}px` : '',
            top: arrowY !== null ? `${arrowY}px` : '',
            right: '',
            bottom: '',
            [staticSide ?? '']: '-4px',
          });
        }
      });
    },
    { animationFrame: true }
  );
};

const destroyTooltip = () => {
  if (cleanupAutoUpdate) {
    cleanupAutoUpdate();
    cleanupAutoUpdate = null;
  }
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
};

const onTitleMouseEnter = (event: MouseEvent, path: string) => {
  const target = event.currentTarget as HTMLElement;
  createTooltip(target, path);
};

const onTitleMouseLeave = () => {
  destroyTooltip();
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
  destroyTooltip();
});
</script>

<template>
  <div class="task-sidebar">
    <!-- 顶部工具栏 -->
    <div class="task-sidebar-toolbar">
      <div class="task-filter-group">
        <label class="task-filter-radio">
          <input v-model="filterStatus" type="radio" value="incomplete" />
          <span>{{ i18n.inProgress ?? '未完成' }}</span>
        </label>
        <label class="task-filter-radio">
          <input v-model="filterStatus" type="radio" value="completed" />
          <span>{{ i18n.completed ?? '已完成' }}</span>
        </label>
        <label class="task-filter-radio">
          <input v-model="filterStatus" type="radio" value="all" />
          <span>{{ i18n.all ?? '全部' }}</span>
        </label>
      </div>
      <button
        class="task-refresh-btn b3-button b3-button--text"
        :title="i18n.refresh ?? '刷新'"
        @click="handleRefresh"
      >
        <svg class="icon"><use xlink:href="#iconRefresh"></use></svg>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="task-sidebar-content">
      <div v-if="isLoading" class="task-sidebar-loading">
        <div class="loading-spinner"></div>
        <span>{{ i18n.loading ?? '加载中...' }}</span>
      </div>
      <div v-else-if="loadError" class="task-sidebar-error">
        <svg class="error-icon">
          <use xlink:href="#iconError"></use>
        </svg>
        <span>{{ loadError }}</span>
      </div>
      <div v-else-if="filteredTasks.length === 0" class="task-sidebar-empty">
        <svg class="empty-icon">
          <use xlink:href="#iconEmpty"></use>
        </svg>
        <span>{{ i18n.noTasks ?? '暂无任务' }}</span>
      </div>
      <div v-else>
        <div v-for="group in groups" :key="group.rootId" class="task-doc-group">
          <div
            class="task-doc-title"
            @mouseenter="
              onTitleMouseEnter($event, '/' + group.boxTitle + group.rootPath)
            "
            @mouseleave="onTitleMouseLeave"
          >
            <span class="task-doc-title-text">{{ group.rootTitle }}</span>
            <span class="task-doc-count">{{ group.tasks.length }}</span>
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
      <span class="task-stat task-stat--primary">
        <span class="stat-dot"></span>
        {{ i18n.inProgress ?? '进行中' }}：{{ incompleteTasks }}
      </span>
      <span class="task-stat task-stat--success">
        <span class="stat-dot"></span>
        {{ i18n.completed ?? '已完成' }}：{{ completedTasks }}
      </span>
      <span class="task-stat task-stat--info">
        <span class="stat-dot"></span>
        {{ i18n.totalTasks ?? '总任务' }}：{{ totalTasks }}
      </span>
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
    padding: 10px 14px;
    background: var(--b3-theme-background);
    color: var(--b3-toolbar-color);
    border-bottom: 1px solid var(--b3-border-color);
    gap: 12px;
    backdrop-filter: blur(8px);
  }

  .task-filter-group {
    display: inline-flex;
    gap: 3px;
    background: var(--b3-theme-background);
    border-radius: 20px;
    padding: 4px;
    border: 1px solid var(--b3-border-color);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .task-filter-radio {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 13px;
    color: var(--b3-theme-on-surface);
    user-select: none;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
    }

    &.is-selected {
      background: linear-gradient(
        135deg,
        var(--b3-theme-primary) 0%,
        var(--b3-theme-primary-light) 100%
      );
      color: var(--b3-theme-on-primary);
      box-shadow: 0 2px 6px rgba(var(--b3-theme-primary-rgb), 0.3);
      font-weight: 600;

      input[type='radio'] {
        accent-color: var(--b3-theme-on-primary);
      }
    }

    &:has(input[type='radio']:checked) {
      background: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      box-shadow: var(--b3-point-shadow);

      input[type='radio'] {
        accent-color: var(--b3-theme-on-primary);
        background-color: var(--b3-theme-on-primary);
      }
    }

    input[type='radio'] {
      margin: 0;
      width: 14px;
      height: 14px;
      cursor: pointer;
      transition: transform 0.15s ease;
      flex-shrink: 0;

      &:active {
        transform: scale(0.9);
      }
    }

    span {
      line-height: 1.2;
      margin-left: 5px;
      font-weight: 500;
      pointer-events: none;
    }
  }

  .task-refresh-btn {
    padding: 6px;
    min-width: auto;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--b3-theme-on-surface);
    transition: all 0.2s ease;

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
      transition: transform 0.3s ease;
    }

    &:hover {
      background: var(--b3-theme-surface);
      color: var(--b3-theme-primary);
      border-color: var(--b3-border-color);

      .icon {
        transform: rotate(90deg);
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }

  // 内容区域（可滚动）
  .task-sidebar-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px;
    scroll-behavior: smooth;

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(
        180deg,
        var(--b3-border-color) 0%,
        var(--b3-theme-on-surface) 100%
      );
      border-radius: 3px;

      &:hover {
        background: var(--b3-theme-primary);
      }
    }
  }

  .task-sidebar-loading,
  .task-sidebar-error,
  .task-sidebar-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
    padding: 48px 24px;
    color: var(--b3-theme-on-surface);
    font-size: 14px;

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--b3-border-color);
      border-top-color: var(--b3-theme-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .error-icon,
    .empty-icon {
      width: 36px;
      height: 36px;
      opacity: 0.8;
    }

    .error-icon {
      color: var(--b3-theme-danger);
    }
    .empty-icon {
      color: var(--b3-theme-on-background);
      margin-bottom: 8px;
    }
  }

  .task-sidebar-error {
    color: var(--b3-theme-danger);
  }

  .task-doc-group {
    margin-bottom: 18px;
    animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .task-doc-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-weight: 600;
    font-size: 14px;
    padding: 9px 13px;
    background: linear-gradient(
      135deg,
      rgba(var(--b3-theme-primary-rgb), 0.08) 0%,
      rgba(128, 128, 128, 0.04) 100%
    );
    border-radius: 10px;
    margin-bottom: 10px;
    color: var(--b3-theme-on-surface);
    border-left: 4px solid var(--b3-theme-primary);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--b3-point-shadow);

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(var(--b3-theme-primary-rgb), 0.12) 0%,
        rgba(128, 128, 128, 0.08) 100%
      );
      transform: translateX(3px);
      box-shadow: var(--b3-point-shadow);
      border-left-width: 5px;
    }

    .task-doc-title-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-doc-count {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 7px;
      background: linear-gradient(
        135deg,
        var(--b3-theme-primary) 0%,
        var(--b3-theme-primary-light) 100%
      );
      color: var(--b3-theme-on-primary);
      font-size: 11px;
      font-weight: 700;
      border-radius: 12px;
      box-shadow: 0 2px 5px var(--b3-theme-primary-light);
      transition: transform 0.2s ease;
    }

    &:hover .task-doc-count {
      transform: scale(1.05);
    }
  }

  // 底部状态栏
  .task-sidebar-footer {
    flex-shrink: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 12px 14px;
    background: linear-gradient(
      180deg,
      var(--b3-toolbar-background) 0%,
      var(--b3-toolbar-background-light) 100%
    );
    color: var(--b3-toolbar-color);
    border-top: 1px solid var(--b3-border-color);
    font-size: 12px;
    gap: 8px;
    backdrop-filter: blur(8px);
    box-shadow: 0 -1px 3px var(--b3-list-hover);

    .task-stat {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      justify-content: center;
      padding: 5px 9px;
      border-radius: 7px;
      transition: all 0.2s ease;
      font-weight: 500;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: currentColor;
        opacity: 0;
        transition: opacity 0.2s ease;
        border-radius: 7px;
      }

      &:hover {
        &::before {
          opacity: 0.08;
        }
      }

      .stat-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
        box-shadow: 0 0 6px currentColor;
        animation: pulse 2s ease-in-out infinite;
      }

      &.task-stat--primary {
        color: var(--b3-theme-primary);

        .stat-dot {
          background: var(--b3-theme-primary);
        }
      }

      &.task-stat--success {
        color: var(--b3-theme-success);

        .stat-dot {
          background: var(--b3-theme-success);
        }
      }

      &.task-stat--info {
        color: var(--b3-theme-on-surface);

        .stat-dot {
          background: var(--b3-theme-on-surface);
        }
      }
    }
  }
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
</style>
<style lang="scss">
// 全局 Tooltip 样式（不在 scoped 内，以便在 body 中生效）
.task-sidebar-tooltip {
  position: absolute;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  border: transparent;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-family: var(--b3-font-family), serif;
  box-shadow: var(--b3-dialog-shadow);
  white-space: normal;
  word-break: break-all;
  max-width: 400px;
  z-index: 10000;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.task-sidebar-tooltip-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: inherit;
  border: inherit;
  transform: rotate(45deg);
  pointer-events: none;
  z-index: -1;
}
</style>
