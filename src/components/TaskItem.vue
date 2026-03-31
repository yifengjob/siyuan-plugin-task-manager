<script setup lang="ts">
import type { Task } from '@/types';
import { computed } from 'vue';
import { usePlugin } from '@/utils/pluginInstance.ts';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{
    (e: 'click', task: Task, event: MouseEvent): void;
    (e: 'toggle-completed', taskId: string, completed: boolean): void;
}>();

const i18n = usePlugin().i18n;

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

// 预编译正则表达式（提升性能）
const DATE_TIME_14_DIGITS = /^\d{14}$/;
const DATE_TIME_12_DIGITS = /^\d{12}$/; // 新增：12 位数字格式 (yyyyMMddHHmm)
const STANDARD_DATE_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const STANDARD_DATE_TIME_NO_SECONDS = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/; // 新增：不含秒的标准格式
const STANDARD_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/; // 新增：仅日期格式

/**
 * 格式化日期时间
 * 统一返回格式：yyyy-MM-dd HH:mm:ss
 */
const formatDate = (value: string | null): string => {
    if (!value) return '—';

    // 情况 1: 14 位数字格式 (yyyyMMddHHmmss)
    if (DATE_TIME_14_DIGITS.test(value)) {
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        const hour = value.substring(8, 10);
        const minute = value.substring(10, 12);
        const second = value.substring(12, 14);
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    // 情况 2: 12 位数字格式 (yyyyMMddHHmm) - 不含秒
    if (DATE_TIME_12_DIGITS.test(value)) {
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        const hour = value.substring(8, 10);
        const minute = value.substring(10, 12);
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }

    // 情况 3: 已是标准格式 (yyyy-MM-dd HH:mm:ss)
    if (STANDARD_DATE_TIME.test(value)) {
        return `${value}`;
    }

    // 情况 4: 标准格式不含秒 (yyyy-MM-dd HH:mm)
    if (STANDARD_DATE_TIME_NO_SECONDS.test(value)) {
        return `${value}`;
    }

    // 情况 5: 仅日期格式 (yyyy-MM-dd)
    if (STANDARD_DATE_ONLY.test(value)) {
        return `${value}`;
    }

    // 情况 6: 其他可解析的日期格式
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        // 统一格式化为 yyyy-MM-dd HH:mm:ss
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 情况 7: 无效日期
    return '—';
};

const onToggle = (e: Event) => {
    const checkbox = e.target as HTMLInputElement;
    // eslint-disable-next-line vue/custom-event-name-casing
    emit('toggle-completed', props.task.id, checkbox.checked);
};

const onClick = (e: MouseEvent) => {
    emit('click', props.task, e);
};
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
            <div class="task-priority" :title="i18n.priority">
                <svg class="icon">
                    <use xlink:href="#iconTaskPriority"></use>
                </svg>
                {{ priorityText }}
            </div>
            <div class="task-status" :title="i18n.status">
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
        <div class="task-metas">
            <div class="task-notes" :title="i18n.notes">
                <svg class="icon">
                    <use xlink:href="#iconTaskNotes"></use>
                </svg>
                {{ task.attrs.notes || '-' }}
            </div>
        </div>
        <div class="task-metas">
            <div class="task-date" :title="i18n.created">
                <svg class="icon">
                    <use xlink:href="#iconTaskCreated"></use>
                </svg>
                {{ formatDate(task.created) }}
            </div>
            <div class="task-date" :title="i18n.start">
                <svg class="icon">
                    <use xlink:href="#iconTaskStart"></use>
                </svg>
                {{ formatDate(task.attrs.start) }}
            </div>
            <div class="task-date" :title="i18n.planDue">
                <svg class="icon">
                    <use xlink:href="#iconTaskPlanDue"></use>
                </svg>
                {{ formatDate(task.attrs.planDue) }}
            </div>
            <div class="task-date" :title="i18n.actualDue">
                <svg class="icon">
                    <use xlink:href="#iconTaskActualDue"></use>
                </svg>
                {{ formatDate(task.attrs.actualDue) }}
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.task-item {
    background: var(--b3-theme-background);
    padding: 12px;
    transition: all 0.2s ease;
    border-bottom: 1px dotted var(--b3-border-color);

    .task-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;

        .task-checkbox-container {
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            position: relative;
            user-select: none;
            width: 18px;
            height: 18px;
            margin-top: 3px;
            margin-left: 6px;

            .task-checkbox {
                position: absolute;
                opacity: 0;
                cursor: pointer;
                height: 0;
                width: 0;

                &:checked + .checkmark {
                    background-color: var(--b3-theme-primary);
                    border-color: var(--b3-theme-primary);

                    &::after {
                        content: '';
                        position: absolute;
                        display: block;
                        left: 4px;
                        top: 1px;
                        width: 4px;
                        height: 8px;
                        border: solid var(--b3-theme-on-primary);
                        border-width: 0 2px 2px 0;
                        transform: rotate(45deg);
                    }
                }
            }

            .checkmark {
                position: absolute;
                top: 0;
                left: 0;
                height: 14px;
                width: 14px;
                background-color: var(--b3-theme-background);
                border: 1px solid var(--b3-border-color);
                border-radius: 4px;
                transition: all 0.2s;

                &::after {
                    content: '';
                    position: absolute;
                    display: none;
                    left: 4px;
                    top: 1px;
                    width: 4px;
                    height: 8px;
                    border: solid var(--b3-theme-on-primary);
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }
            }
        }

        .task-title {
            font-weight: 500;
            font-size: 14px;
            line-height: 1.4;
            color: var(--b3-theme-on-background);
            flex: 1;
            word-break: break-word;
            cursor: pointer;
        }
    }

    .task-metas {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--b3-theme-on-surface);

        .task-priority,
        .task-status,
        .task-notes,
        .task-date {
            flex: 1;
            min-width: fit-content;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--b3-theme-background);
            padding: 2px 8px;
            border-radius: 5px;

            .icon {
                width: 14px !important;
                height: 14px !important;
                fill: currentColor;
                flex-shrink: 0;

                svg {
                    width: 14px !important;
                    height: 14px !important;
                }
            }
        }
    }
}
</style>
