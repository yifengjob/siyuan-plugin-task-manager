<template>
    <VueDatePicker
        v-model="localDate"
        :format="format"
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
import '@vuepic/vue-datepicker/dist/main.css';
import { usePlugin } from '@/utils/pluginInstance';

// ============ Props ============
const props = defineProps<{
    modelValue: string;
    placeholder?: string;
    title?: string;
    readonly?: boolean;
    type?: 'date' | 'datetime' | 'time';
    enableSeconds?: boolean;
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
// 提取格式化模式生成逻辑（避免重复）
const createFormatPatterns = (
    componentType: 'date' | 'datetime' | 'time',
    showSeconds: boolean
) => {
    const timeFormat = showSeconds ? 'HH:mm:ss' : 'HH:mm';
    const dateTimeFormat = showSeconds
        ? 'yyyy-MM-dd HH:mm:ss'
        : 'yyyy-MM-dd HH:mm';

    return {
        second: 'ss',
        minute: 'mm',
        hour: 'HH',
        day: 'dd',
        week: 'EEE',
        month: 'MM',
        year: 'yyyy',
        input:
            componentType === 'time'
                ? timeFormat
                : componentType === 'date'
                  ? 'yyyy-MM-dd'
                  : dateTimeFormat,
        preview:
            componentType === 'time'
                ? timeFormat
                : componentType === 'date'
                  ? 'yyyy-MM-dd'
                  : dateTimeFormat,
    };
};

// 使用 computed 确保响应式更新
const formats = computed(() =>
    createFormatPatterns(type, props.enableSeconds ?? false)
);

// 日期选择器配置
const timeConfig = {
    enableTimePicker: type === 'datetime',
    enableSeconds: props.enableSeconds || false,
};
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

    // 处理日期格式 YYYY-MM-DD 或日期时间格式 YYYY-MM-DD HH:mm:ss
    let dateStr = value;
    if (type === 'datetime') {
        // 如果只包含日期部分，补上 00:00:00
        if (!dateStr.includes(' ') && !dateStr.includes('T')) {
            dateStr += ' 00:00:00';
        }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (date: Date | null): string => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    if (type === 'date') {
        return `${year}-${month}-${day}`;
    } else if (type === 'time') {
        return `${hours}:${minutes}:${seconds}`;
    } else {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
};

// ============ 格式函数（用于显示） ==========
const format = (date: Date): string => {
    if (type === 'date') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else if (type === 'time') {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    } else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
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
//
/* 布局变量调整（与思源风格一致） */
.dp__theme_light,
.dp__theme_dark {
    --dp-border-radius: var(--b3-border-radius);
    --dp-cell-border-radius: var(--b3-border-radius);
    --dp-common-transition: var(--b3-transition);
    --dp-font-size: var(--b3-font-size);
    --dp-font-family:
        var(--b3-font-family), system-ui, -apple-system, BlinkMacSystemFont,
        'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

.task-datetimepicker.is-readonly {
    pointer-events: none;
    opacity: 0.6;
}
</style>
