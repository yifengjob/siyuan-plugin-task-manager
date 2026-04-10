/**
 * 应用常量配置
 * 集中管理所有魔法数字和配置常量，便于维护和调整
 */

// ============ 性能优化相关常量 ============

import { PluginConfig } from '@/types';

/**
 * WebSocket 事件处理节流延迟（毫秒）
 * 用于防止高频任务状态变更导致频繁刷新
 */
export const THROTTLE_DELAY = 50;

/**
 * 防抖刷新延迟（毫秒）
 * 用于文档结构变化后的延迟刷新
 */
export const DEBOUNCE_DELAY = 50;

/**
 * 已处理块 ID 缓存最大数量
 * 超过此数量会自动清理最旧的缓存
 */
export const MAX_CACHED_BLOCK_IDS = 1000;

/**
 * 缓存过期时间（毫秒）
 * 5 分钟
 */
export const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

/**
 * 自动清理缓存的触发间隔
 * 每处理 100 个块 ID 触发一次清理
 */
export const CACHE_CLEANUP_INTERVAL = 100;

// ============ UI 相关常量 ============

/**
 * Popover 隐藏延迟（毫秒）
 */
export const POPOVER_HIDE_DELAY = 300;

/**
 * Popover 自动关闭默认延迟（秒）
 */
export const DEFAULT_AUTO_HIDE_DELAY = 5;

/**
 * Tooltip 最大宽度（像素）
 */
export const TOOLTIP_MAX_WIDTH = 400;

/**
 * 侧边栏默认宽度（像素）
 */
export const SIDEBAR_DEFAULT_WIDTH = 360;

// ============ 虚拟滚动相关常量 ============

/**
 * 启用虚拟滚动的最小任务数量
 */
export const VIRTUAL_SCROLL_THRESHOLD = 50;

/**
 * 虚拟滚动项默认高度（像素）
 */
export const VIRTUAL_ITEM_HEIGHT = 180;

/**
 * 虚拟滚动预渲染缓冲区大小
 */
export const VIRTUAL_BUFFER_SIZE = 5;

// ============ 日期时间格式常量 ============

/**
 * 默认日期时间格式
 */
export const DEFAULT_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

/**
 * 完整日期时间格式（包含秒）
 */
export const FULL_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/**
 * 仅日期格式
 */
export const DATE_ONLY_FORMAT = 'yyyy-MM-dd';

// ============ 数据库查询相关常量 ============

/**
 * SQL 参数占位符前缀
 */
export const SQL_PARAM_PREFIX = '{{';

/**
 * SQL 参数占位符后缀
 */
export const SQL_PARAM_SUFFIX = '}}';

// ============ 优先级常量 ============

/**
 * 任务优先级枚举
 */
export const TASK_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

/**
 * 优先级显示文本映射键
 */
export type TaskPriority = keyof typeof TASK_PRIORITY;

// ============ 筛选状态常量 ============

/**
 * 任务筛选状态
 */
export const FILTER_STATUS = {
  ALL: 'all',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
} as const;

export type FilterStatus = (typeof FILTER_STATUS)[keyof typeof FILTER_STATUS];

// ============ 错误消息常量 ============

/**
 * 通用错误消息
 */
export const ERROR_MESSAGES = {
  LOAD_TASKS_FAILED: '加载任务失败，请刷新重试',
  REFRESH_FAILED: '刷新失败，请稍后重试',
  UPDATE_TASK_FAILED: '任务更新失败',
  SAVE_CONFIG_FAILED: '配置保存失败',
  NETWORK_ERROR: '网络错误，请检查连接',
  UNKNOWN_ERROR: '发生未知错误',
} as const;

// ============ 成功消息常量 ============

/**
 * 通用成功消息
 */
export const SUCCESS_MESSAGES = {
  CONFIG_SAVED: '配置保存成功',
  TASK_UPDATED: '任务更新成功',
} as const;

// ============ 默认配置常量 ============
export const DEFAULT_CONFIG: PluginConfig = {
  defaultProgressGroup: FILTER_STATUS.INCOMPLETE,
  autoHidePopoverDelay: DEFAULT_AUTO_HIDE_DELAY,
  filteredNotebooks: [],
  filteredBlocks: [],
  datetimeFormatPattern: DEFAULT_DATETIME_FORMAT,
  virtualScrollThreshold: VIRTUAL_SCROLL_THRESHOLD,
};

// ============ CSS 类名常量 ============

/**
 * 日期选择器相关 CSS 选择器
 */
export const DATE_PICKER_SELECTORS = [
  '.task-datetimepicker',
  '.dp__menu',
  '.dp__menu_wrapper',
  '.dp__calendar',
  '.dp__time_picker',
  '.v-popper__popper',
  '[class*="dp__"]',
] as const;

/**
 * 滚动容器选择器
 */
export const SCROLL_CONTAINER_SELECTORS = [
  '.protyle-content',
  '.fn__flex-1',
  '.layout__tab-content',
  '.task-sidebar-content',
] as const;
