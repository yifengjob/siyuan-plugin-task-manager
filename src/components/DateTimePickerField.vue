<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, useId } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { zhCN, enUS } from 'date-fns/locale';
import { usePlugin, formatDateObject, parseDate } from '@/utils';
import '@vuepic/vue-datepicker/dist/main.css';

// ============ Props ============
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    title?: string;
    readonly?: boolean;
    type?: 'date' | 'datetime' | 'time';
    formatPattern?: string;
  }>(),
  {
    type: 'date',
    readonly: false,
    placeholder: undefined,
    title: undefined,
    formatPattern: undefined,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// ============ 组件选项 ============
defineOptions({
  name: 'DateTimePickerField',
  inheritAttrs: false,
});

// ============ 插件实例 ============
const plugin = usePlugin();
const i18n = plugin.i18n;

// ============ 唯一 ID（用于无障碍） ============
const inputId = useId();

// ============ 状态 ============
const localDate = ref<Date | null>(null);
const isDark = ref(false);
const locale = ref(zhCN);

// ============ 格式化模式映射 ============
const FORMAT_PATTERNS: Record<'date' | 'datetime' | 'time', string> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  time: 'HH:mm:ss',
};

// ============ 计算属性 ============
const dateTimeFormatPattern = computed(() => {
  return props.formatPattern || FORMAT_PATTERNS[props.type];
});

const formats = computed(() => ({
  second: 'ss',
  minute: 'mm',
  hour: 'HH',
  day: 'dd',
  week: 'EEE',
  month: 'MM',
  year: 'yyyy',
  input: dateTimeFormatPattern.value,
  preview: dateTimeFormatPattern.value,
}));

const timeConfig = computed(() => ({
  enableTimePicker: props.type === 'datetime',
  enableSeconds:
    props.type.includes('time') && dateTimeFormatPattern.value.includes('ss'),
}));

const actionRow = computed(() => ({
  selectBtnLabel: i18n.btnOk,
  cancelBtnLabel: i18n.btnCancel,
  nowBtnLabel: i18n.btnNow,
  showSelect: true,
  showCancel: true,
  showNow: true,
  showPreview: true,
}));

// ============ 主题检测 ============
const detectDarkTheme = () => {
  const bgColor = getComputedStyle(document.body)
    .getPropertyValue('--b3-theme-background')
    .trim();

  if (!bgColor) return;

  const rgb = bgColor.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    const brightness =
      (parseInt(rgb[0]) * 299 +
        parseInt(rgb[1]) * 587 +
        parseInt(rgb[2]) * 114) /
      1000;
    isDark.value = brightness < 128;
  }
};

let observer: MutationObserver | null = null;

onMounted(() => {
  detectDarkTheme();
  observer = new MutationObserver(detectDarkTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
  updateLocale();
});

onUnmounted(() => {
  observer?.disconnect();
});

// ============ 语言更新 ============
const updateLocale = () => {
  locale.value = navigator.language.includes('zh') ? zhCN : enUS;
};

// ============ 日期解析 ============
const parseDateTime = (value: string): Date | null => {
  if (!value) return null;

  if (props.type === 'time') {
    const parts = value.split(':');
    if (parts.length >= 2) {
      const date = new Date();
      date.setHours(parseInt(parts[0], 10));
      date.setMinutes(parseInt(parts[1], 10));
      date.setSeconds(parts.length > 2 ? parseInt(parts[2], 10) : 0);
      return date;
    }
    return null;
  }

  return parseDate(value);
};

const formatDateTime = (date: Date | null): string => {
  if (!date) return '';
  return formatDateObject(date, dateTimeFormatPattern.value);
};

// ============ 监听数据变化 ============
watch(
  () => props.modelValue,
  (newVal) => {
    localDate.value = parseDateTime(newVal);
  },
  { immediate: true }
);

watch(localDate, (newVal) => {
  const formatted = formatDateTime(newVal);
  if (formatted !== props.modelValue) {
    emit('update:modelValue', formatted);
  }
});
</script>

<template>
  <VueDatePicker
    :id="inputId"
    v-model="localDate"
    :formats="formats"
    :locale="locale"
    :placeholder="placeholder || title || ''"
    :title="title || placeholder || ''"
    :time-config="timeConfig"
    :time-picker="type === 'time'"
    :action-row="actionRow"
    :disabled="readonly"
    :teleport="true"
    :auto-apply="false"
    :text-input="false"
    :clearable="false"
    :dark="isDark"
    class="task-datetimepicker"
    :class="{ 'is-readonly': readonly }"
  >
    <template #input-icon>
      <slot name="input-icon"></slot>
    </template>
  </VueDatePicker>
</template>

<style lang="scss">
/* ========== 全局主题变量覆盖（适配思源笔记） ========== */

/* 浅色主题 */
.dp__theme_light {
  --dp-background-color: var(--b3-theme-background);
  --dp-text-color: var(--b3-theme-on-background);
  --dp-hover-color: var(--b3-theme-surface);
  --dp-hover-text-color: var(--b3-theme-on-surface);
  --dp-hover-icon-color: var(--b3-theme-primary);
  --dp-primary-color: var(--b3-theme-primary);
  --dp-primary-disabled-color: var(--b3-theme-primary-light);
  --dp-primary-text-color: var(--b3-theme-on-primary);
  --dp-secondary-color: var(--b3-theme-on-surface);
  --dp-border-color: var(--b3-border-color);
  --dp-menu-border-color: var(--b3-border-color);
  --dp-border-color-hover: var(--b3-theme-primary);
  --dp-border-color-focus: var(--b3-theme-primary);
  --dp-disabled-color: var(--b3-theme-surface);
  --dp-disabled-color-text: var(--b3-theme-on-surface);
  --dp-scroll-bar-background: var(--b3-theme-surface);
  --dp-scroll-bar-color: var(--b3-theme-on-surface);
  --dp-success-color: var(--b3-theme-success);
  --dp-success-color-disabled: var(--b3-theme-success-light);
  --dp-icon-color: var(--b3-theme-on-background);
  --dp-danger-color: var(--b3-theme-danger);
  --dp-marker-color: var(--b3-theme-danger);
  --dp-tooltip-color: var(--b3-theme-background);
  --dp-highlight-color: var(--b3-theme-primary-lightest);
  --dp-range-between-dates-background-color: var(--b3-theme-primary-lightest);
  --dp-range-between-dates-text-color: var(--b3-theme-on-background);
  --dp-range-between-border-color: var(--b3-theme-primary-light);
}

/* 深色主题 */
.dp__theme_dark {
  --dp-background-color: var(--b3-theme-background);
  --dp-text-color: var(--b3-theme-on-background);
  --dp-hover-color: var(--b3-theme-surface);
  --dp-hover-text-color: var(--b3-theme-on-surface);
  --dp-hover-icon-color: var(--b3-theme-primary);
  --dp-primary-color: var(--b3-theme-primary);
  --dp-primary-disabled-color: var(--b3-theme-primary-light);
  --dp-primary-text-color: var(--b3-theme-on-primary);
  --dp-secondary-color: var(--b3-theme-on-surface);
  --dp-border-color: var(--b3-border-color);
  --dp-menu-border-color: var(--b3-border-color);
  --dp-border-color-hover: var(--b3-theme-primary);
  --dp-border-color-focus: var(--b3-theme-primary);
  --dp-disabled-color: var(--b3-theme-surface);
  --dp-disabled-color-text: var(--b3-theme-on-surface);
  --dp-scroll-bar-background: var(--b3-theme-surface);
  --dp-scroll-bar-color: var(--b3-theme-on-surface);
  --dp-success-color: var(--b3-theme-success);
  --dp-success-color-disabled: var(--b3-theme-success-light);
  --dp-icon-color: var(--b3-theme-on-background);
  --dp-danger-color: var(--b3-theme-danger);
  --dp-marker-color: var(--b3-theme-danger);
  --dp-tooltip-color: var(--b3-theme-background);
  --dp-highlight-color: var(--b3-theme-primary-lightest);
  --dp-range-between-dates-background-color: var(--b3-theme-primary-lightest);
  --dp-range-between-dates-text-color: var(--b3-theme-on-background);
  --dp-range-between-border-color: var(--b3-theme-primary-light);
}

/* 布局变量调整（与思源风格一致） */
.dp__theme_light,
.dp__theme_dark {
  --dp-menu-min-width: 320px;
  --dp-border-radius: var(--b3-border-radius);
  --dp-cell-border-radius: var(--b3-border-radius);
  --dp-common-transition: var(--b3-transition);
  --dp-font-size: var(--b3-font-size);
  --dp-font-family:
    var(--b3-font-family-code), var(--b3-font-family), sans-serif;
}

.task-datetimepicker.is-readonly {
  pointer-events: none;
  opacity: 0.6;
}
</style>
