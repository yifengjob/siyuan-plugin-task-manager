date
<script setup lang="ts">
import type { Task, PopoverOptions } from '@/types';
import { taskService } from '@/services/TaskService';
import { usePlugin } from '@/utils';
import { handleError } from '@/utils/ErrorHandler';
import { useTaskStore } from '@/stores/tasks.store';
import { useConfigStore } from '@/stores/config.store';
import TaskItem from './TaskItem.vue';
import ErrorBoundary from './ErrorBoundary.vue';
import { useTaskFilter } from '@/composables/useTaskFilter';
import { useTaskSync } from '@/composables/useTaskSync';
import { useTooltip } from '@/composables/useTooltip';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import { computed } from 'vue';

const plugin = usePlugin();
const i18n = plugin.i18n;
const taskStore = useTaskStore();
const configStore = useConfigStore();

// 使用 composables
const {
  filterStatus,
  filteredTasks,
  groups,
  totalTasks,
  completedTasks,
  incompleteTasks,
  searchQuery,
  setSearchQuery,
  clearSearch,
  hasActiveSearch,
  searchResultCount,
} = useTaskFilter();

const { isLoading, loadError, handleRefresh } = useTaskSync();

const { onMouseEnter: onTitleMouseEnter, onMouseLeave: onTitleMouseLeave } =
  useTooltip();

// 扁平化任务列表用于虚拟滚动（带分组标题）
const mixedItemsList = computed(() => {
  const items: Array<{
    id: string;
    type: 'header' | 'task';
    rootId?: string;
    rootTitle?: string;
    boxTitle?: string;
    rootPath?: string;
    taskCount?: number;
    task?: Task;
  }> = [];
  groups.value.forEach((group) => {
    // 添加标题项
    items.push({
      id: `header-${group.rootId}`,
      type: 'header',
      rootId: group.rootId,
      rootTitle: group.rootTitle,
      boxTitle: group.boxTitle,
      rootPath: group.rootPath,
      taskCount: group.tasks.length,
    });
    // 添加该组的所有任务
    group.tasks.forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        type: 'task',
        task,
      });
    });
  });
  return items;
});

// 是否启用虚拟滚动（从配置中读取阈值）
const shouldEnableVirtualScroll = computed(
  () => mixedItemsList.value.length >= configStore.config.virtualScrollThreshold
);

/**
 * 任务点击处理 - 显示编辑 Popover
 */
const onTaskClick = async (task: Task, event?: MouseEvent) => {
  const id = task.id;
  if (!id) return;

  try {
    // 获取任务的 DOM 元素
    const taskElement = document.querySelector(
      `.task-item[data-id="${id}"]`
    ) as HTMLElement;

    if (!taskElement) {
      // 如果找不到 DOM 元素，降级为打开文档
      await taskService.openTask(id);
      return;
    }

    // 获取任务属性
    const [attrs, createdDate] = await Promise.all([
      taskService.getTaskAttrs(id),
      taskService.getBlockCreated(id),
    ]);

    const taskElementRect = taskElement.getBoundingClientRect();
    const referencePoint = {
      x: taskElementRect.left,
      y: event?.y || taskElementRect.top + taskElementRect.height / 2,
    };
    // 构建 Popover 选项
    const options: PopoverOptions = {
      placement: 'left',
      offset: 15,
      taskId: id,
      referenceEl: taskElement,
      isEditable: true,
      attrs,
      createdDate,
      referencePoint: referencePoint,
    };

    // 显示 Popover - 通过 plugin 实例访问 appComponent
    // @ts-expect-error - appComponent 是私有属性，但我们需要访问它
    if (plugin.appComponent && 'showPopover' in plugin.appComponent) {
      // @ts-expect-error - showPopover 方法存在于 appComponent 中
      plugin.appComponent.showPopover(options);
    }
  } catch (error) {
    handleError(error, { action: 'showTaskPopover', taskId: id });
  }
};

/**
 * 打开任务所在的块
 */
const onOpenTask = async (task: Task) => {
  const id = task.id;
  if (id) {
    try {
      await taskService.openTask(id);
    } catch (error) {
      handleError(error, { action: 'openTask', taskId: id });
    }
  }
};

/**
 * 切换任务完成状态
 */
const toggleCompleted = async (taskId: string, completed: boolean) => {
  try {
    await taskStore.toggleTaskStatus(taskId, completed);
  } catch (error) {
    handleError(error, { action: 'toggleTask', taskId });
  }
};
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

    <!-- 搜索栏 -->
    <div v-if="totalTasks > 0" class="task-search-bar">
      <div class="task-search-input-wrapper">
        <svg class="search-icon">
          <use xlink:href="#iconSearch"></use>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="task-search-input"
          :placeholder="i18n.search ?? '搜索任务...'"
          @input="(e) => setSearchQuery((e.target as HTMLInputElement).value)"
        />
        <button
          v-if="hasActiveSearch"
          class="search-clear-btn"
          title="清除搜索"
          @click="clearSearch"
        >
          <svg class="icon"><use xlink:href="#iconClose"></use></svg>
        </button>
      </div>
      <div v-if="hasActiveSearch" class="search-result-count">
        找到 {{ searchResultCount }} 个结果
      </div>
    </div>

    <!-- 内容区域 -->
    <ErrorBoundary name="SidebarContent">
      <div
        class="task-sidebar-content"
        :class="{ 'virtual-scroll-enabled': shouldEnableVirtualScroll }"
      >
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
          <span v-if="hasActiveSearch">{{
            i18n.noSearchResults ?? '未找到匹配的任务'
          }}</span>
          <span v-else>{{ i18n.noTasks ?? '暂无任务' }}</span>
        </div>
        <div v-else>
          <!-- 虚拟滚动模式 -->
          <DynamicScroller
            v-if="shouldEnableVirtualScroll"
            v-slot="{ item, index, active }"
            class="virtual-scroller"
            :items="mixedItemsList"
            :min-item-size="50"
            key-field="id"
          >
            <DynamicScrollerItem
              :item="item"
              :active="active"
              :size-dependencies="[
                item.type === 'task' && item.task
                  ? [
                      item.task.attrs.priority,
                      item.task.attrs.actualDue,
                      item.task.attrs.start,
                      item.task.attrs.planDue,
                      item.task.attrs.notes,
                    ]
                  : [],
              ]"
              :data-index="index"
            >
              <!-- 标题项：直接使用 task-doc-title，不使用 task-doc-group 包裹 -->
              <div v-if="item.type === 'header'" class="virtual-scroll-header">
                <div
                  class="task-doc-title"
                  @mouseenter="
                    onTitleMouseEnter(
                      $event,
                      '/' + item.boxTitle + item.rootPath
                    )
                  "
                  @mouseleave="onTitleMouseLeave"
                >
                  <span class="task-doc-title-text">{{ item.rootTitle }}</span>
                  <span class="task-doc-count">{{ item.taskCount }}</span>
                </div>
              </div>
              <!-- 任务项：直接使用 TaskItem，不使用 task-doc-group 包裹 -->
              <TaskItem
                v-else-if="item.type === 'task' && item.task"
                class="virtual-scroll-task"
                :task="item.task"
                @click="onTaskClick"
                @open-task="onOpenTask"
                @toggle-completed="toggleCompleted"
              />
            </DynamicScrollerItem>
          </DynamicScroller>
          <!-- 普通模式 -->
          <div v-else>
            <div
              v-for="group in groups"
              :key="group.rootId"
              class="task-doc-group"
            >
              <ErrorBoundary :name="`Group-${group.rootId}`">
                <div
                  class="task-doc-title"
                  @mouseenter="
                    onTitleMouseEnter(
                      $event,
                      '/' + group.boxTitle + group.rootPath
                    )
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
                  @open-task="onOpenTask"
                  @toggle-completed="toggleCompleted"
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>

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

  // 搜索栏样式
  .task-search-bar {
    flex-shrink: 0;
    padding: 10px 14px;
    background: var(--b3-theme-surface-light);
    border-bottom: 1px solid var(--b3-border-color);

    .task-search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--b3-theme-background);
      border: 1px solid var(--b3-border-color);
      border-radius: 8px;
      padding: 6px 10px;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: var(--b3-theme-primary);
        box-shadow: 0 0 0 2px rgba(var(--b3-theme-primary-rgb), 0.1);
      }

      .search-icon {
        width: 16px;
        height: 16px;
        fill: var(--b3-theme-on-surface);
        margin-right: 8px;
        flex-shrink: 0;
      }

      .task-search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 13px;
        color: var(--b3-theme-on-background);
        font-family: inherit;

        &::placeholder {
          color: var(--b3-theme-on-surface);
          opacity: 0.6;
        }
      }

      .search-clear-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 4px;
        color: var(--b3-theme-on-surface);
        transition: all 0.2s ease;

        .icon {
          width: var(--b3-font-size);
          height: var(--b3-font-size);
          fill: currentColor;
        }

        &:hover {
          background: var(--b3-theme-surface);
          color: var(--b3-theme-error);
        }
      }
    }

    .search-result-count {
      margin-top: 6px;
      font-size: 12px;
      color: var(--b3-theme-primary);
      text-align: right;
      font-weight: 500;
    }
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

    // 虚拟滚动模式
    &.virtual-scroll-enabled {
      padding: 0; // 移除默认 padding
      overflow-x: visible !important; // 允许横向溢出，显示 box-shadow
    }

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
    border: 1px solid rgba(128, 128, 128, 0.1);
    border-left: 4px solid var(--b3-theme-primary);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    //box-shadow: var(--b3-point-shadow);

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(var(--b3-theme-primary-rgb), 0.12) 0%,
        rgba(128, 128, 128, 0.08) 100%
      );
      transform: translateY(-1px);
      border-color: rgba(128, 128, 128, 0.15);
      border-left-color: var(--b3-theme-primary);
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

// 1. 容器级别：移除 padding，让 .virtual-scroller 内部控制
.task-sidebar-content.virtual-scroll-enabled {
  padding: 0 !important;
}

// 2. 虚拟滚动容器：设置 padding
.task-sidebar-content.virtual-scroll-enabled .virtual-scroller {
  width: 100% !important;
  height: 100% !important;
  padding: 10px !important;
  box-sizing: border-box !important;
}

// 3. 修复 margin 塌陷 + 设置间距
.task-sidebar-content.virtual-scroll-enabled {
  .vue-recycle-scroller__item-view > div[data-index] {
    padding: 1px 0; // 防止 margin 塌陷
    width: 100%;

    .virtual-scroll-header {
      margin: 0 0 10px 0 !important;

      .task-doc-title {
        margin-bottom: 0 !important;
      }
    }

    .virtual-scroll-task {
      margin: 0 0 8px 0 !important;
    }
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
