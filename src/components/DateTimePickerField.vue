<template>
    <VueDatePicker
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
            <slot name="input-icon"> </slot>
        </template>
    </VueDatePicker>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { zhCN, enUS } from 'date-fns/locale';
import { usePlugin } from '@/utils/pluginInstance';
import { formatDateObject, parseDate } from '@/utils/dateTimeUtils';
import '@vuepic/vue-datepicker/dist/main.css';

// ============ Props ============
const props = defineProps<{
    modelValue: string;
    placeholder?: string;
    title?: string;
    readonly?: boolean;
    type?: 'date' | 'datetime' | 'time';
    formatPattern?: string; // 显示格式，如 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss'
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

// ============ 插件实例 ============
const plugin = usePlugin();
const i18n = plugin.i18n;

// ============ 类型默认值 ============
const type = props.type ?? 'date';

// ============ 状态 ============
const localDate = ref<Date | null>(null);
const isDark = ref(false);
const locale = ref(zhCN); // 默认中文，后续根据插件语言更新

// ============ 格式化模式映射 ============
// VueDatePicker 使用 date-fns 的格式标记
const FORMAT_PATTERNS: Record<string, Record<string, string>> = {
    date: {
        pattern: 'yyyy-MM-dd',
    },
    datetime: {
        pattern: 'yyyy-MM-dd HH:mm:ss',
    },
    time: {
        pattern: 'HH:mm:ss',
    },
};

// ============ 计算属性：显示格式 ============
const dateTimeFormatPattern = computed(() => {
    return props.formatPattern || FORMAT_PATTERNS[type].pattern;
});
const formats = computed(() => {
    return {
        second: 'ss',
        minute: 'mm',
        hour: 'HH',
        day: 'dd',
        week: 'EEE',
        month: 'MM',
        year: 'yyyy',
        input: dateTimeFormatPattern.value,
        preview: dateTimeFormatPattern.value,
    };
});

// 日期选择器配置
const timeConfig = computed(() => ({
    enableTimePicker: type === 'datetime',
    enableSeconds: dateTimeFormatPattern.value.includes('ss'),
}));

const actionRow = {
    selectBtnLabel: i18n.btnOk,
    cancelBtnLabel: i18n.btnCancel,
    nowBtnLabel: i18n.btnNow,
    showSelect: true,
    showCancel: true,
    showNow: true,
    showPreview: true,
};

// ============ 主题检测（基于思源 CSS 变量） ==========
const detectDarkTheme = () => {
    const bgColor = getComputedStyle(document.body)
        .getPropertyValue('--b3-theme-background')
        .trim();
    if (bgColor) {
        const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
            const brightness =
                (parseInt(rgb[0]) * 299 +
                    parseInt(rgb[1]) * 587 +
                    parseInt(rgb[2]) * 114) /
                1000;
            isDark.value = brightness < 128;
        }
    }
};

let observer: MutationObserver | null = null;
onMounted(() => {
    detectDarkTheme();
    observer = new MutationObserver(() => {
        detectDarkTheme();
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
    });
});
onUnmounted(() => {
    if (observer) observer.disconnect();
});

// ============ 语言检测与更新 ==========
const updateLocale = () => {
    const lang = navigator.language;
    if (lang.includes('zh')) {
        locale.value = zhCN;
    } else {
        locale.value = enUS;
    }
};
updateLocale();

// ============ 日期解析与格式化 ==========
/**
 * 将字符串解析为 Date 对象
 */
const parseDateTime = (value: string): Date | null => {
    if (!value) return null;

    // 处理纯时间格式 HH:mm:ss 或 HH:mm
    if (type === 'time') {
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

    // 使用通用工具函数解析日期
    return parseDate(value);
};

/**
 * 将 Date 对象格式化为字符串
 */
const formatDateTime = (date: Date | null): string => {
    if (!date) return '';

    // 使用通用工具函数格式化
    return formatDateObject(date, dateTimeFormatPattern.value);
};

// ============ 监听数据变化 ==========
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
