<script setup lang="ts">
import type { PopoverOptions, TaskAttrs } from '@/types';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { usePlugin } from '@/utils/pluginInstance';

// ============ Props & Emits ============
const props = defineProps<{
    options: PopoverOptions | null;
}>();

const emit = defineEmits<{
    (e: 'save', attrs: TaskAttrs): void;
    (e: 'close'): void;
}>();

// ============ Plugin Instance ============
const plugin = usePlugin();

// ============ DOM References ============
const containerRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);

// ============ State ============
const isVisible = ref(false);
const placement = ref('bottom');
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null; // 新增：3秒自动关闭定时器
let focusCount = 0;
let referenceElement: HTMLElement | null = null;
let referencePoint: { x: number; y: number } | null = null;
let scrollListeners: (() => void)[] = [];
const currentBlockId = ref<string | undefined>(undefined);

// ============ Form Data ============
const form = ref({
    start: '',
    planDue: '',
    actualDue: '',
    priority: 'normal',
    notes: '',
});

// ============ Computed Properties ============
const createdStr = computed(() => {
    if (!props.options?.createdDate) return '—';
    const created = props.options.createdDate;
    const year = created.substring(0, 4);
    const month = created.substring(4, 6);
    const day = created.substring(6, 8);
    const hour = created.substring(8, 10);
    const minute = created.substring(10, 12);
    return `${year}-${month}-${day} ${hour}:${minute}`;
});

// ============ Form Methods ============
const updateForm = () => {
    if (props.options) {
        form.value = {
            start: props.options.attrs.start || '',
            planDue: props.options.attrs.planDue || '',
            actualDue: props.options.attrs.actualDue || '',
            priority: props.options.attrs.priority || 'normal',
            notes: props.options.attrs.notes || '',
        };
    }
};

const handleSave = () => {
    emit('save', {
        start: form.value.start,
        planDue: form.value.planDue,
        actualDue: form.value.actualDue,
        priority: form.value.priority,
        notes: form.value.notes,
        completed: form.value.actualDue !== '',
    });
    close();
};

const handleCancel = () => {
    close();
};

// ============ Positioning Methods ============
// 顶部额外偏移补充
const topExtraOffsetSupplement = 14;
// 偏移补充
const offset = 10;
const updatePosition = (retryCount = 0) => {
    if (!containerRef.value || !referenceElement) return;

    const popoverRect = containerRef.value.getBoundingClientRect();
    if (
        (popoverRect.width === 0 || popoverRect.height === 0) &&
        retryCount < 5
    ) {
        setTimeout(() => updatePosition(retryCount + 1), 100);
        return;
    }

    const triggerRect = referenceElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const refPoint = referencePoint || {
        x: triggerRect.left + triggerRect.width / 2,
        y: triggerRect.top + triggerRect.height / 2,
    };

    const placements = ['top', 'bottom', 'left', 'right'];
    let bestPlacement = 'bottom';
    for (const p of placements) {
        if (
            checkPlacement(
                p,
                triggerRect,
                popoverRect,
                viewportWidth,
                viewportHeight,
                refPoint
            )
        ) {
            bestPlacement = p;
            break;
        }
    }
    placement.value = bestPlacement;
    containerRef.value.setAttribute('data-placement', bestPlacement);

    let left = 0;
    let top = 0;

    switch (bestPlacement) {
        case 'top':
            left = refPoint.x - popoverRect.width / 2;
            top =
                triggerRect.top -
                popoverRect.height -
                offset -
                topExtraOffsetSupplement;
            break;
        case 'bottom':
            left = refPoint.x - popoverRect.width / 2;
            top = triggerRect.bottom + offset;
            break;
        case 'left':
            left = triggerRect.left - popoverRect.width - offset;
            top = refPoint.y - popoverRect.height / 2;
            break;
        case 'right':
            left = triggerRect.right + offset;
            top = refPoint.y - popoverRect.height / 2;
            break;
    }

    left = Math.max(0, Math.min(left, viewportWidth - popoverRect.width));
    top = Math.max(0, Math.min(top, viewportHeight - popoverRect.height));

    containerRef.value.style.left = `${left + scrollX}px`;
    containerRef.value.style.top = `${top + scrollY}px`;

    if (arrowRef.value) {
        const popoverLeft = left;
        const popoverTop = top;
        let arrowOffset = 0;
        switch (bestPlacement) {
            case 'top':
            case 'bottom':
                arrowOffset = refPoint.x - popoverLeft;
                arrowOffset = Math.max(
                    12,
                    Math.min(arrowOffset, popoverRect.width - 12)
                );
                arrowRef.value.style.left = `${arrowOffset}px`;
                arrowRef.value.style.right = 'auto';
                break;
            case 'left':
            case 'right':
                arrowOffset = refPoint.y - popoverTop;
                arrowOffset = Math.max(
                    12,
                    Math.min(arrowOffset, popoverRect.height - 12)
                );
                arrowRef.value.style.top = `${arrowOffset}px`;
                arrowRef.value.style.bottom = 'auto';
                break;
        }
    }
};

const checkPlacement = (
    placement: string,
    triggerRect: DOMRect,
    popoverRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    refPoint: { x: number; y: number }
): boolean => {
    let left = 0;
    let top = 0;
    switch (placement) {
        case 'top':
            left = refPoint.x - popoverRect.width / 2;
            top =
                triggerRect.top -
                popoverRect.height -
                offset -
                topExtraOffsetSupplement;
            break;
        case 'bottom':
            left = refPoint.x - popoverRect.width / 2;
            top = triggerRect.bottom + offset;
            break;
        case 'left':
            left = triggerRect.left - popoverRect.width - offset;
            top = refPoint.y - popoverRect.height / 2;
            break;
        case 'right':
            left = triggerRect.right + offset;
            top = refPoint.y - popoverRect.height / 2;
            break;
    }
    return (
        left >= 0 &&
        left + popoverRect.width <= viewportWidth &&
        top >= 0 &&
        top + popoverRect.height <= viewportHeight
    );
};

// ============ Visibility Control ============
const cancelHideTimer = () => {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
};

const startHideTimer = (delay = 300) => {
    if (focusCount > 0) return;
    cancelHideTimer();
    hideTimer = setTimeout(() => {
        close();
    }, delay);
};

// ============ Event Handlers for Popover ============
let isMouseOverPopover = false;

const onPopoverMouseEnter = () => {
    isMouseOverPopover = true;
    cancelHideTimer();
    // 鼠标进入 Popover，取消自动关闭定时器
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }
};

const onPopoverMouseLeave = (e: MouseEvent) => {
    isMouseOverPopover = false;

    // 如果鼠标移入触发元素，则不隐藏
    if (
        referenceElement &&
        referenceElement.contains(e.relatedTarget as Node)
    ) {
        return;
    }

    startHideTimer();
};

const onPopoverFocusIn = () => {
    focusCount++;
    cancelHideTimer();
};

const onPopoverFocusOut = (_e: FocusEvent) => {
    setTimeout(() => {
        focusCount = Math.max(0, focusCount - 1);

        // 当没有焦点、鼠标不在 popover 上时，启动隐藏定时器
        if (
            focusCount === 0 &&
            !isMouseOverPopover &&
            containerRef.value &&
            !containerRef.value.matches(':hover')
        ) {
            startHideTimer();
        }
    }, 100);
};

// ============ Event Handlers for Trigger Element ============
const onTriggerMouseEnter = () => {
    cancelHideTimer();
};

const onTriggerMouseLeave = (e: MouseEvent) => {
    // 如果鼠标移入 Popover，则不隐藏
    if (
        containerRef.value &&
        containerRef.value.contains(e.relatedTarget as Node)
    ) {
        return;
    }
    startHideTimer();
};

// ============ Global Event Handlers ============
const onDocumentClick = (e: MouseEvent) => {
    if (!containerRef.value || !referenceElement) return;
    const target = e.target as Node;
    if (
        !containerRef.value.contains(target) &&
        !referenceElement.contains(target)
    ) {
        close();
    }
};

// 键盘事件处理：ESC 始终关闭，其他键仅在鼠标不在 Popover 上时关闭
const onKeydown = (e: KeyboardEvent) => {
    if (!isVisible.value) return;

    // ESC 键始终关闭
    if (e.key === 'Escape') {
        close();
        return;
    }

    // 其他按键：只有鼠标不在 Popover 上时才关闭
    if (!isMouseOverPopover) {
        close();
    }
};

const onScroll = () => {
    if (isVisible.value) {
        close();
    }
};

const onResize = () => {
    if (isVisible.value) {
        updatePosition();
    }
};

const onTextareaInput = () => {
    if (isVisible.value) {
        updatePosition();
    }
};

// ============ Scroll Management ============
const bindScrollEvents = () => {
    window.addEventListener('scroll', onScroll, { passive: true });
    const scrollContainers = document.querySelectorAll(
        '.protyle-content, .fn__flex-1, .layout__tab-content, .task-sidebar'
    );
    scrollContainers.forEach((container) => {
        container.addEventListener('scroll', onScroll, { passive: true });
        scrollListeners.push(() =>
            container.removeEventListener('scroll', onScroll)
        );
    });
};

const unbindScrollEvents = () => {
    window.removeEventListener('scroll', onScroll);
    scrollListeners.forEach((unbind) => unbind());
    scrollListeners = [];
};

// ============ Show & Close ============
const show = () => {
    if (!props.options) return;

    const blockId = props.options.taskId;

    if (isVisible.value && currentBlockId.value === blockId) {
        close();
        return;
    }

    if (isVisible.value) {
        close(true);
    }

    referenceElement = props.options.referenceEl;
    referencePoint = props.options.referencePoint || null;
    updateForm();

    isVisible.value = true;
    currentBlockId.value = blockId;

    // 为触发元素添加事件监听
    if (referenceElement) {
        referenceElement.addEventListener('mouseenter', onTriggerMouseEnter);
        referenceElement.addEventListener('mouseleave', onTriggerMouseLeave);
    }

    nextTick(() => {
        requestAnimationFrame(() => {
            updatePosition();
        });
    });

    // 设置3秒后自动关闭（如果鼠标从未进入Popover）
    if (plugin.getConfig().addAutoHidePopoverDelay > 0) {
        autoCloseTimer = setTimeout(() => {
            if (!isMouseOverPopover) {
                close();
            }
            autoCloseTimer = null;
        }, plugin.getConfig().addAutoHidePopoverDelay * 1000);
    }

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown, { capture: true });
    bindScrollEvents();
    window.addEventListener('resize', onResize);
};

const close = (skipEmit = false) => {
    cancelHideTimer();
    // 取消自动关闭定时器
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }

    if (!skipEmit) {
        setTimeout(() => {
            emit('close');
        }, 200);
    }

    // 移除触发元素的事件监听
    if (referenceElement) {
        referenceElement.removeEventListener('mouseenter', onTriggerMouseEnter);
        referenceElement.removeEventListener('mouseleave', onTriggerMouseLeave);
    }

    isVisible.value = false;
    referenceElement = null;
    referencePoint = null;
    focusCount = 0;
    currentBlockId.value = undefined;

    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown, { capture: true });
    window.removeEventListener('resize', onResize);
    unbindScrollEvents();
};

// ============ Watchers ============
watch(
    () => props.options,
    (newOptions) => {
        if (newOptions) {
            show();
        } else {
            if (isVisible.value) close();
        }
    },
    { immediate: true }
);

// ============ Lifecycle Hooks ============
onUnmounted(() => {
    cancelHideTimer();
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    if (referenceElement) {
        referenceElement.removeEventListener('mouseenter', onTriggerMouseEnter);
        referenceElement.removeEventListener('mouseleave', onTriggerMouseLeave);
    }
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown, { capture: true });
    window.removeEventListener('resize', onResize);
    unbindScrollEvents();
});
</script>

<template>
    <Teleport to="body">
        <Transition name="popover-fade">
            <div
                v-if="isVisible"
                ref="containerRef"
                class="task-popover-container"
                :data-placement="placement"
                @mouseenter="onPopoverMouseEnter"
                @mouseleave="onPopoverMouseLeave"
                @focusin="onPopoverFocusIn"
                @focusout="onPopoverFocusOut"
            >
                <div class="task-popover">
                    <div ref="arrowRef" class="popover-arrow" />

                    <div class="task-popover-content">
                        <div class="task-full-form">
                            <!-- Row 1: Start & Plan Due -->
                            <div class="task-tooltip-row">
                                <span class="tooltip-field">
                                    <svg class="icon">
                                        <use xlink:href="#iconTaskStart" />
                                    </svg>
                                    <input
                                        v-model="form.start"
                                        type="date"
                                        :readonly="!options?.isEditable"
                                        :title="plugin.i18n.start"
                                        :placeholder="plugin.i18n.start"
                                    />
                                </span>

                                <span class="tooltip-field">
                                    <svg class="icon">
                                        <use xlink:href="#iconTaskPlanDue" />
                                    </svg>
                                    <input
                                        v-model="form.planDue"
                                        type="date"
                                        :readonly="!options?.isEditable"
                                        :title="plugin.i18n.planDue"
                                        :placeholder="plugin.i18n.planDue"
                                    />
                                </span>
                            </div>

                            <!-- Row 2: Actual Due & Priority -->
                            <div class="task-tooltip-row">
                                <span class="tooltip-field">
                                    <svg class="icon">
                                        <use xlink:href="#iconTaskActualDue" />
                                    </svg>
                                    <input
                                        v-model="form.actualDue"
                                        type="date"
                                        :readonly="!options?.isEditable"
                                        :title="plugin.i18n.actualDue"
                                        :placeholder="plugin.i18n.actualDue"
                                    />
                                </span>

                                <span class="tooltip-field">
                                    <svg class="icon">
                                        <use xlink:href="#iconTaskPriority" />
                                    </svg>
                                    <select
                                        v-model="form.priority"
                                        :disabled="!options?.isEditable"
                                        :title="plugin.i18n.priority"
                                    >
                                        <option value="high">
                                            {{ plugin.i18n.priorityHigh }}
                                        </option>
                                        <option value="medium">
                                            {{ plugin.i18n.priorityMedium }}
                                        </option>
                                        <option value="normal">
                                            {{ plugin.i18n.priorityNormal }}
                                        </option>
                                        <option value="low">
                                            {{ plugin.i18n.priorityLow }}
                                        </option>
                                    </select>
                                </span>
                            </div>

                            <!-- Row 3: Notes -->
                            <div class="task-tooltip-row">
                                <span
                                    class="tooltip-field tooltip-field--notes"
                                >
                                    <svg class="icon">
                                        <use xlink:href="#iconTaskNotes" />
                                    </svg>
                                    <textarea
                                        v-model="form.notes"
                                        :readonly="!options?.isEditable"
                                        rows="3"
                                        :title="plugin.i18n.notes"
                                        :placeholder="plugin.i18n.notes"
                                        @input="onTextareaInput"
                                    />
                                </span>
                            </div>

                            <!-- Footer: Created Date & Buttons -->
                            <div class="task-tooltip-created">
                                <div>
                                    <svg class="icon">
                                        <use xlink:href="#iconTaskCreated" />
                                    </svg>
                                    {{ createdStr }}
                                </div>

                                <div class="task-tooltip-buttons">
                                    <button
                                        v-if="options?.isEditable"
                                        class="task-save-btn b3-button b3-button--outline"
                                        @click="handleSave"
                                    >
                                        {{ plugin.i18n.save }}
                                    </button>

                                    <button
                                        class="task-cancel-btn b3-button b3-button--outline"
                                        @click="handleCancel"
                                    >
                                        {{ plugin.i18n.cancel }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped lang="scss">
// ============ Transitions ============
.popover-fade-enter-active,
.popover-fade-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

// ============ Container ============
.task-popover-container {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10000;
    pointer-events: none;
}

// ============ Popover Base ============
.task-popover {
    pointer-events: auto;
    background: var(--b3-theme-background);
    border-radius: 8px;
    box-shadow: var(--b3-dialog-shadow);
    padding: 8px;
    width: fit-content;
    max-width: 500px;
    box-sizing: border-box;
    font-family: var(--b3-font-family), serif;
    font-size: var(--b3-font-size);
    color: var(--b3-theme-on-background);
    transition: opacity 0.2s ease;
}

// ============ Arrow ============
.popover-arrow {
    position: absolute;
    width: 12px;
    height: 12px;
    background: inherit;
    border: 1px solid var(--b3-border-color);
    transform: rotate(45deg);
    z-index: -1;
    pointer-events: none;
}

.task-popover-container[data-placement='top'] .popover-arrow {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
}

.task-popover-container[data-placement='bottom'] .popover-arrow {
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
}

.task-popover-container[data-placement='left'] .popover-arrow {
    right: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-left: none;
    border-bottom: none;
}

.task-popover-container[data-placement='right'] .popover-arrow {
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-right: none;
    border-top: none;
}

// ============ Content Area ============
.task-popover-content {
    padding: 0;
}

// ============ Form Layout ============
.task-full-form {
    padding: 8px;
    width: fit-content;
    min-width: 200px;
    max-width: 500px;
}

.task-tooltip-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

// ============ Form Fields ============
.tooltip-field {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--b3-theme-surface);
    border-radius: 4px;
    padding: 4px;
    flex: 1 1 180px;
    border: 1px solid transparent;
    transition:
        border-color 0.2s,
        background 0.2s;
    box-sizing: border-box;

    &:hover {
        border-color: var(--b3-theme-primary-light);
        background: var(--b3-theme-background);
    }

    .icon {
        width: 16px;
        height: 16px;
        fill: currentColor;
        flex-shrink: 0;
        color: var(--b3-theme-on-background);
    }

    input,
    select,
    textarea {
        border: none;
        background: transparent;
        padding: 2px 0;
        font-size: 13px;
        color: var(--b3-theme-on-background);
        width: 100%;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
    }

    textarea {
        resize: vertical;
        min-height: 60px;
        line-height: 1.5;
    }

    select {
        cursor: pointer;
    }

    &.tooltip-field--notes {
        width: 100% !important;
        flex: 0 0 100%;
        align-items: flex-start;

        .icon {
            margin-top: 4px;
        }
    }
}

// ============ Footer ============
.task-tooltip-created {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 4px 8px;
    background: var(--b3-theme-surface);
    border-radius: 30px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);

    div {
        display: flex;
        align-items: center;
        gap: 8px;

        .icon {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
    }
}

// ============ Action Buttons ============
.task-tooltip-buttons {
    display: flex;
    gap: 8px;

    button {
        padding: 4px 12px;
        font-size: 13px;
        border-radius: 30px;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 0.2s,
            box-shadow 0.2s;
        border: none;
    }
}

.task-save-btn {
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    border: 1px solid var(--b3-border-color);

    &:hover {
        background: var(--b3-theme-primary-light);
        color: var(--b3-theme-on-primary-light);
        box-shadow: 0 2px 8px var(--b3-theme-primary-light);
    }
}

.task-cancel-btn {
    background: transparent;
    border: 1px solid var(--b3-border-color);
    color: var(--b3-theme-on-background);

    &:hover {
        background: var(--b3-theme-surface);
    }
}
</style>
