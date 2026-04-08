<script setup lang="ts">
import type { PopoverOptions, TaskAttrs } from '@/types';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { usePlugin } from '@/utils';
import {
  computePosition,
  autoUpdate,
  offset,
  shift,
  flip,
  arrow as arrowMiddleware,
  type Placement,
} from '@floating-ui/dom';
import DateTimePickerField from '@/components/DateTimePickerField.vue';
import { formatDate } from '@/utils/DateTimeUtils';
import { useConfigStore } from '@/stores/config.store';
import { POPOVER_HIDE_DELAY, DATE_PICKER_SELECTORS } from '@/constants';

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
const i18n = plugin.i18n;
const configStore = useConfigStore();
const dateTimeFormatPattern = computed(() => {
  return configStore.config.datetimeFormatPattern;
});

// ============ DOM References ============
const containerRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);

// ============ State ============
const isVisible = ref(false);
const placement = ref<Placement>('bottom'); // 当前实际使用的方向
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
let focusCount = 0;
let referenceElement: HTMLElement | null = null;
let referencePoint: { x: number; y: number } | null = null;
let scrollListeners: (() => void)[] = [];
const currentBlockId = ref<string | undefined>(undefined);
let cleanupAutoUpdate: (() => void) | null = null;

// 浮动 UI 的虚拟参考元素（用于鼠标坐标定位）
let virtualReference: { getBoundingClientRect: () => DOMRect } | null = null;

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
  return formatDate(props.options.createdDate, dateTimeFormatPattern.value);
});

// ============ Form Methods ============
const updateForm = () => {
  const attrs = props.options?.attrs;
  form.value = {
    start: attrs?.start ?? '',
    planDue: attrs?.planDue ?? '',
    actualDue: attrs?.actualDue ?? '',
    priority: attrs?.priority ?? 'normal',
    notes: attrs?.notes ?? '',
  };
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

// ============ Floating UI 位置更新 ============
const updatePosition = () => {
  if (!containerRef.value || !arrowRef.value) return;

  // 确定参考元素：优先使用 referencePoint 创建的虚拟参考，否则使用实际 DOM 元素
  let reference = referenceElement;
  if (referencePoint && !virtualReference) {
    virtualReference = {
      getBoundingClientRect() {
        // 返回一个真正的 DOMRect 对象
        return new DOMRect(referencePoint?.x, referencePoint?.y, 0, 0);
      },
    };
    reference = virtualReference as any;
  } else if (referencePoint && virtualReference) {
    reference = virtualReference as any;
  }

  if (!reference) return;

  computePosition(reference, containerRef.value, {
    placement: 'top', // 基础方向，允许 flip 翻转
    middleware: [
      offset(30),
      flip(),
      shift({ padding: 8 }),
      arrowMiddleware({ element: arrowRef.value, padding: 4 }),
    ],
  }).then(({ x, y, placement: newPlacement, middlewareData }) => {
    if (containerRef.value) {
      Object.assign(containerRef.value.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    }
    placement.value = newPlacement;
    containerRef.value?.setAttribute('data-placement', newPlacement);

    if (arrowRef.value && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[newPlacement.split('-')[0]];
      Object.assign(arrowRef.value.style, {
        left: arrowX !== null ? `${arrowX}px` : '',
        top: arrowY !== null ? `${arrowY}px` : '',
        right: '',
        bottom: '',
        [staticSide ?? '']: '-6px',
      });
    }
  });
};

// 启动自动更新位置
const startAutoUpdate = () => {
  if (!referenceElement && !referencePoint) return;
  if (cleanupAutoUpdate) cleanupAutoUpdate();

  let reference = referenceElement;
  if (referencePoint) {
    if (!virtualReference) {
      virtualReference = {
        getBoundingClientRect() {
          return new DOMRect(referencePoint?.x, referencePoint?.y, 0, 0);
        },
      };
    }
    reference = virtualReference as any;
  }

  if (!reference || !containerRef.value) return;
  cleanupAutoUpdate = autoUpdate(
    reference,
    containerRef.value,
    updatePosition,
    { animationFrame: true }
  );
};

// 停止自动更新
const stopAutoUpdate = () => {
  if (cleanupAutoUpdate) {
    cleanupAutoUpdate();
    cleanupAutoUpdate = null;
  }
};

// ============ Visibility Control ============
const cancelHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const startHideTimer = (delay = POPOVER_HIDE_DELAY) => {
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
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
};

const onPopoverMouseLeave = (e: MouseEvent) => {
  isMouseOverPopover = false;
  // 检查鼠标移入的目标是否是日期选择器面板
  const relatedTarget = e.relatedTarget;
  let isInDatePicker = false;
  if (relatedTarget instanceof Element) {
    isInDatePicker = DATE_PICKER_SELECTORS.some((selector) =>
      relatedTarget.closest(selector)
    );
  }
  if (isInDatePicker) {
    // 如果鼠标移入日期选择器面板，不隐藏
    return;
  }
  if (referenceElement && referenceElement.contains(e.relatedTarget as Node)) {
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
    // 检查焦点是否移到了日期选择器面板内
    const activeElement = document.activeElement;
    let isInDatePicker = false;
    if (activeElement instanceof Element) {
      isInDatePicker = DATE_PICKER_SELECTORS.some((selector) =>
        activeElement.closest(selector)
      );
    }
    if (isInDatePicker) {
      // 如果焦点在日期选择器面板内，不启动隐藏定时器
      return;
    }
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
  // 检查是否点击在日期选择器弹出面板内
  let isDatePickerPanel = false;
  if (target instanceof Element) {
    for (const selector of DATE_PICKER_SELECTORS) {
      if (target.closest(selector)) {
        isDatePickerPanel = true;
        break;
      }
    }
  }
  if (isDatePickerPanel) {
    // 点击在日期选择器面板上，不关闭 Popover
    return;
  }

  if (
    !containerRef.value.contains(target) &&
    !referenceElement.contains(target)
  ) {
    close();
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (!isVisible.value) return;
  if (e.key === 'Escape') {
    close();
    return;
  }
  if (!isMouseOverPopover) {
    close();
  }
};

const onScroll = () => {
  if (isVisible.value) close();
};

const onResize = () => {
  if (isVisible.value) updatePosition();
};

const onTextareaInput = () => {
  if (isVisible.value) updatePosition();
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
// 使用标志位防止重复绑定
let isListenersBound = false;

const bindEventListeners = () => {
  if (isListenersBound) return;

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown, { capture: true });
  bindScrollEvents();
  window.addEventListener('resize', onResize);
  isListenersBound = true;
};

const unbindEventListeners = () => {
  if (!isListenersBound) return;

  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown, { capture: true });
  unbindScrollEvents();
  window.removeEventListener('resize', onResize);
  isListenersBound = false;
};
const show = () => {
  if (!props.options) return;
  const blockId = props.options.taskId;

  if (isVisible.value && currentBlockId.value === blockId) {
    close();
    return;
  }
  if (isVisible.value) close(true);

  referenceElement = props.options.referenceEl;
  referencePoint = props.options.referencePoint || null;
  virtualReference = null; // 重置虚拟参考
  updateForm();

  isVisible.value = true;
  currentBlockId.value = blockId;

  if (referenceElement) {
    referenceElement.addEventListener('mouseenter', onTriggerMouseEnter);
    referenceElement.addEventListener('mouseleave', onTriggerMouseLeave);
  }

  nextTick(() => {
    startAutoUpdate();
    updatePosition(); // 立即更新一次
  });

  // 自动隐藏定时器
  if (plugin.getConfig().autoHidePopoverDelay > 0) {
    autoCloseTimer = setTimeout(() => {
      if (!isMouseOverPopover) close();
      autoCloseTimer = null;
    }, plugin.getConfig().autoHidePopoverDelay * 1000);
  }

  bindEventListeners();
};

const close = (skipEmit = false) => {
  cancelHideTimer();
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  if (!skipEmit) {
    setTimeout(() => emit('close'), POPOVER_HIDE_DELAY);
  }
  if (referenceElement) {
    referenceElement.removeEventListener('mouseenter', onTriggerMouseEnter);
    referenceElement.removeEventListener('mouseleave', onTriggerMouseLeave);
  }
  isVisible.value = false;
  referenceElement = null;
  referencePoint = null;
  virtualReference = null;
  focusCount = 0;
  currentBlockId.value = undefined;

  unbindEventListeners();
  stopAutoUpdate();
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
  stopAutoUpdate();
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
              <!-- 表单内容保持不变 -->
              <div class="task-tooltip-row">
                <span class="tooltip-field">
                  <!--                                    <svg class="icon">-->
                  <!--                                        <use xlink:href="#iconTaskStart" />-->
                  <!--                                    </svg>-->
                  <!--                                    <input-->
                  <!--                                        v-model="form.start"-->
                  <!--                                        type="date"-->
                  <!--                                        :readonly="!options?.isEditable"-->
                  <!--                                        :title="plugin.i18n.start"-->
                  <!--                                        :placeholder="plugin.i18n.start"-->
                  <!--                                    />-->
                  <DateTimePickerField
                    v-model="form.start"
                    type="datetime"
                    :readonly="!options?.isEditable"
                    :title="i18n.start"
                    :placeholder="i18n.start"
                    :format-pattern="dateTimeFormatPattern"
                  >
                    <template #input-icon>
                      <svg class="icon">
                        <use xlink:href="#iconTaskStart" />
                      </svg>
                    </template>
                  </DateTimePickerField>
                </span>
                <span class="tooltip-field">
                  <!--                                    <svg class="icon">-->
                  <!--                                        <use xlink:href="#iconTaskPlanDue" />-->
                  <!--                                    </svg>-->
                  <!--                                    <input-->
                  <!--                                        v-model="form.planDue"-->
                  <!--                                        type="date"-->
                  <!--                                        :readonly="!options?.isEditable"-->
                  <!--                                        :title="plugin.i18n.planDue"-->
                  <!--                                        :placeholder="plugin.i18n.planDue"-->
                  <!--                                    />-->
                  <DateTimePickerField
                    v-model="form.planDue"
                    type="datetime"
                    :readonly="!options?.isEditable"
                    :title="i18n.planDue"
                    :placeholder="i18n.planDue"
                    :format-pattern="dateTimeFormatPattern"
                  >
                    <template #input-icon>
                      <svg class="icon">
                        <use xlink:href="#iconTaskPlanDue" />
                      </svg>
                    </template>
                  </DateTimePickerField>
                </span>
              </div>
              <div class="task-tooltip-row">
                <span class="tooltip-field">
                  <!--                                    <svg class="icon">-->
                  <!--                                        <use xlink:href="#iconTaskActualDue" />-->
                  <!--                                    </svg>-->
                  <!--                                    <input-->
                  <!--                                        v-model="form.actualDue"-->
                  <!--                                        type="date"-->
                  <!--                                        :readonly="!options?.isEditable"-->
                  <!--                                        :title="plugin.i18n.actualDue"-->
                  <!--                                        :placeholder="plugin.i18n.actualDue"-->
                  <!--                                    />-->
                  <DateTimePickerField
                    v-model="form.actualDue"
                    type="datetime"
                    :readonly="!options?.isEditable"
                    :title="i18n.actualDue"
                    :placeholder="i18n.actualDue"
                    :format-pattern="dateTimeFormatPattern"
                  >
                    <template #input-icon>
                      <svg class="icon">
                        <use xlink:href="#iconTaskActualDue" />
                      </svg>
                    </template>
                  </DateTimePickerField>
                </span>
                <span class="tooltip-field">
                  <svg class="icon">
                    <use xlink:href="#iconTaskPriority" />
                  </svg>
                  <select
                    v-model="form.priority"
                    :disabled="!options?.isEditable"
                    :title="i18n.priority"
                  >
                    <option value="high">
                      {{ i18n.priorityHigh }}
                    </option>
                    <option value="medium">
                      {{ i18n.priorityMedium }}
                    </option>
                    <option value="normal">
                      {{ i18n.priorityNormal }}
                    </option>
                    <option value="low">
                      {{ i18n.priorityLow }}
                    </option>
                  </select>
                </span>
              </div>
              <div class="task-tooltip-row">
                <span class="tooltip-field tooltip-field--notes">
                  <svg class="icon">
                    <use xlink:href="#iconTaskNotes" />
                  </svg>
                  <textarea
                    v-model="form.notes"
                    :readonly="!options?.isEditable"
                    rows="3"
                    :title="i18n.notes"
                    :placeholder="i18n.notes"
                    @input="onTextareaInput"
                  />
                </span>
              </div>
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
                    {{ i18n.save }}
                  </button>
                  <button
                    class="task-cancel-btn b3-button b3-button--outline"
                    @click="handleCancel"
                  >
                    {{ i18n.cancel }}
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
/* 样式部分保持不变，与之前相同 */
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
.task-popover-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
}
.task-popover {
  pointer-events: auto;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  box-shadow: var(--b3-dialog-shadow);
  border-radius: 8px;
  border: transparent;
  padding: 8px;
  width: fit-content;
  max-width: 500px;
  box-sizing: border-box;
  font-family: var(--b3-font-family), serif;
  font-size: var(--b3-font-size);
  transition: opacity 0.2s ease;
}
.popover-arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  background: inherit;
  border: inherit;
  transform: rotate(45deg);
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
.task-popover-content {
  padding: 0;
}
.task-full-form {
  padding: 8px;
  width: fit-content;
  min-width: 200px;
  max-width: 310px;
}
.task-tooltip-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.tooltip-field {
  display: flex;
  align-items: center;
  gap: calc(var(--b3-font-size) / 2);
  background: var(--b3-theme-surface);
  border-radius: 4px;
  padding: 4px;
  flex: 1 1 auto;
  min-width: 140px;
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
    width: var(--b3-font-size);
    height: var(--b3-font-size);
    fill: currentColor;
    flex-shrink: 0;
    color: var(--b3-theme-on-background);
    margin-left: calc(var(--b3-font-size) / 2);
    margin-top: calc(var(--b3-font-size) / 3);
  }
  input,
  select,
  textarea {
    border: none;
    background: transparent;
    padding: 2px;
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
      margin-right: 2px;
    }
  }
}
.task-tooltip-created {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 4px 8px;
  background: var(--b3-theme-surface);
  border-radius: 30px;
  font-family: var(--b3-font-family-code), var(--b3-font-family), sans-serif;
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

.task-datetimepicker {
  width: 100%;
  display: block;
  box-sizing: border-box;
  align-items: center;

  :deep(.dp__input_wrap) {
    display: block;
    align-items: center;
    width: 100%;
    vertical-align: center;
  }
  :deep(.dp__input) {
    width: 100%;
    border: none !important;
    outline: none !important;
    background: transparent !important;
    box-sizing: border-box;
  }
}
</style>
