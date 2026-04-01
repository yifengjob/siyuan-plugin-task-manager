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
            <div
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
