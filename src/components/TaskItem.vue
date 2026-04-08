<script setup lang="ts">
import type { Task } from '@/types';
import { computed } from 'vue';
import { usePlugin, formatDate } from '@/utils';
import { useConfigStore } from '@/stores/config.store';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{
  (e: 'click', task: Task, event: MouseEvent): void;
  (e: 'toggle-completed', taskId: string, completed: boolean): void;
}>();
const plugin = usePlugin();
const i18n = plugin.i18n;
const configStore = useConfigStore();
const dateTimeFormatPattern = computed(() => {
  return configStore.config.datetimeFormatPattern;
});

const priorityText = computed(() => {
  const map: Record<string, string> = {
    high: i18n.priorityHigh,
    medium: i18n.priorityMedium,
    normal: i18n.priorityNormal,
    low: i18n.priorityLow,
  };
  return map[props.task.attrs.priority] || props.task.attrs.priority;
});

const statusText = computed(() => {
  return props.task.attrs.completed ? i18n.completed : i18n.inProgress;
});

const onToggle = (e: Event) => {
  const checkbox = e.target as HTMLInputElement;

  emit('toggle-completed', props.task.id, checkbox.checked);
};

const onClick = (e: MouseEvent) => {
  emit('click', props.task, e);
};

// 优化：只有存在元数据时才渲染对应的区域
const hasAnyMetadata = computed(() => {
  return !!(props.task.attrs.notes || props.task.attrs.priority);
});

const hasAnyDateInfo = computed(() => {
  return !!(
    props.task.created ||
    props.task.attrs.start ||
    props.task.attrs.planDue ||
    props.task.attrs.actualDue
  );
});
</script>

<template>
  <div class="task-item" :data-id="task.id">
    <div class="task-header">
      <label class="task-checkbox-container">
        <input
          type="checkbox"
          class="task-checkbox"
          :checked="task.attrs.completed"
          @change="onToggle"
        />
        <span class="checkmark"></span>
      </label>
      <div class="task-title" @click="onClick">
        {{ task.content || i18n.untitled }}
      </div>
    </div>
    <div class="task-metas">
      <div
        v-if="task.attrs.priority"
        class="task-priority"
        :class="task.attrs.priority"
        :title="i18n.priority"
      >
        <svg class="icon">
          <use xlink:href="#iconTaskPriority"></use>
        </svg>
        {{ priorityText }}
      </div>
      <div
        class="task-status"
        :class="task.attrs.completed ? 'completed' : 'incomplete'"
        :title="i18n.status"
      >
        <svg class="icon">
          <use
            v-if="task.attrs.completed"
            xlink:href="#iconTaskStatusDue"
          ></use>
          <use v-else xlink:href="#iconTaskStatusUnDue"></use>
        </svg>
        {{ statusText }}
      </div>
    </div>
    <div v-if="hasAnyMetadata" class="task-metas">
      <div v-if="task.attrs.notes" class="task-notes" :title="i18n.notes">
        <svg class="icon">
          <use xlink:href="#iconTaskNotes"></use>
        </svg>
        {{ task.attrs.notes }}
      </div>
    </div>
    <div v-if="hasAnyDateInfo" class="task-metas task-dates">
      <div v-if="task.created" class="task-date" :title="i18n.created">
        <svg class="icon">
          <use xlink:href="#iconTaskCreated"></use>
        </svg>
        {{ formatDate(task.created, dateTimeFormatPattern) }}
      </div>
      <div v-if="task.attrs.start" class="task-date" :title="i18n.start">
        <svg class="icon">
          <use xlink:href="#iconTaskStart"></use>
        </svg>
        {{ formatDate(task.attrs.start, dateTimeFormatPattern) }}
      </div>
      <div v-if="task.attrs.planDue" class="task-date" :title="i18n.planDue">
        <svg class="icon">
          <use xlink:href="#iconTaskPlanDue"></use>
        </svg>
        {{ formatDate(task.attrs.planDue, dateTimeFormatPattern) }}
      </div>
      <div
        v-if="task.attrs.actualDue"
        class="task-date"
        :title="i18n.actualDue"
      >
        <svg class="icon">
          <use xlink:href="#iconTaskActualDue"></use>
        </svg>
        {{ formatDate(task.attrs.actualDue, dateTimeFormatPattern) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.task-item {
  background: var(--b3-theme-surface-light);
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(128, 128, 128, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:hover {
    background: var(--b3-theme-background);
    transform: translateY(-1px);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 2px 4px rgba(0, 0, 0, 0.04);
    border-color: rgba(128, 128, 128, 0.15);
  }

  &.completed {
    opacity: 0.75;

    .task-title {
      text-decoration: line-through;
      color: var(--b3-theme-on-surface);
    }
  }

  .task-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;

    .task-checkbox-container {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      position: relative;
      user-select: none;
      width: 20px;
      height: 20px;
      margin-top: 2px;
      flex-shrink: 0;

      .task-checkbox {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;

        &:checked + .checkmark {
          background: linear-gradient(
            135deg,
            var(--b3-theme-primary) 0%,
            var(--b3-theme-primary-light) 100%
          );
          border-color: var(--b3-theme-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);

          &::after {
            content: '';
            position: absolute;
            display: block;
            left: 5px;
            top: 2px;
            width: 5px;
            height: 10px;
            border: solid var(--b3-theme-on-primary);
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
            animation: checkPop 0.2s ease-out;
          }
        }
      }

      .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 18px;
        width: 18px;
        background-color: var(--b3-theme-background);
        border: 1.5px solid var(--b3-border-color);
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--b3-theme-primary);
          transform: scale(1.05);
        }

        &::after {
          content: '';
          position: absolute;
          display: none;
          left: 5px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid var(--b3-theme-on-primary);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }
    }

    .task-title {
      font-weight: 500;
      font-size: 14px;
      line-height: 1.5;
      color: var(--b3-theme-on-background);
      flex: 1;
      word-break: break-word;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover {
        color: var(--b3-theme-primary);
      }
    }
  }

  .task-metas {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--b3-theme-on-surface);

    &.task-dates {
      // 日期区域特殊样式，允许换行更自然
      gap: 8px;
    }

    .task-priority,
    .task-status,
    .task-notes,
    .task-date {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(128, 128, 128, 0.06);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(128, 128, 128, 0.1);
        transform: translateY(-1px);
      }

      .icon {
        width: 14px !important;
        height: 14px !important;
        fill: currentColor;
        flex-shrink: 0;
        opacity: 0.85;

        svg {
          width: 14px !important;
          height: 14px !important;
        }
      }
    }
    .task-date {
      font-family: var(--b3-font-family-code), monospace;
    }

    .task-status {
      &.completed {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      &.incomplete {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
    }
    // 优先级特殊样式
    .task-priority {
      &.high {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      &.medium {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }

      &.normal {
        background-color: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      &.low {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
    }
  }
}

@keyframes checkPop {
  0% {
    transform: scale(0) rotate(45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(45deg);
  }
  100% {
    transform: scale(1) rotate(45deg);
    opacity: 1;
  }
}
</style>
