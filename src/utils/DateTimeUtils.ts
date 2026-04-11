// 预编译正则表达式（提升性能）
import { handleError } from './ErrorHandler';

const DATE_TIME_8_DIGITS = /^\d{8}$/; // 8 位数字格式 (yyyyMMdd)
const DATE_TIME_12_DIGITS = /^\d{12}$/; // 12 位数字格式 (yyyyMMddHHmm)
const DATE_TIME_14_DIGITS = /^\d{14}$/; // 14 位数字格式 (yyyyMMddHHmmss)
const STANDARD_DATE_TIME = /^\d{4}[-/.]\d{2}[-/.]\d{2}[T ]\d{2}:\d{2}:\d{2}$/; // 标准格式
const STANDARD_DATE_TIME_NO_SECONDS = /^\d{4}[-/.]\d{2}[-/.]\d{2}[T ]\d{2}:\d{2}$/; // 不含秒的标准格式
const STANDARD_DATE_ONLY = /^\d{4}[-/.]\d{2}[-/.]\d{2}$/; // 仅日期格式

/**
 * 格式化日期对象为指定格式
 * @param date Date 对象
 * @param format 格式字符串，支持：yyyy, MM, dd, HH, mm, ss, SSS(毫秒), E(星期), a(上下午)
 * @returns 格式化后的字符串
 */
export function formatDateObject(date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[date.getDay()];
  const amPm = date.getHours() >= 12 ? 'PM' : 'AM';

  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('SSS', milliseconds)
    .replace('E', weekDay)
    .replace('a', amPm);
}

/**
 * 解析日期字符串为 Date 对象
 * @param value 日期字符串
 * @returns Date 对象或 null
 */
export function parseDate(value: string): Date | null {
  try {
    // 尝试直接使用 Date 构造函数
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }

    // 如果是纯数字格式，转换为标准格式后再解析
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length === 8) {
      // yyyyMMdd
      return new Date(
        `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)}`
      );
    } else if (digits.length === 12) {
      // yyyyMMddHHmm
      return new Date(
        `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)} ${digits.substring(8, 10)}:${digits.substring(10, 12)}`
      );
    } else if (digits.length === 14) {
      // yyyyMMddHHmmss
      return new Date(
        `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)} ${digits.substring(8, 10)}:${digits.substring(10, 12)}:${digits.substring(12, 14)}`
      );
    }

    return null;
  } catch (e) {
    handleError(e, { context: 'parseDate' }, false);
    return null;
  }
}

/**
 * 格式化日期时间
 * @param value 日期字符串或 null
 * @param format 格式字符串（可选），默认 'yyyy-MM-dd HH:mm:ss'
 *               支持的格式标记：yyyy(年), MM(月), dd(日), HH(时), mm(分), ss(秒), SSS(毫秒), E(星期), a(上下午)
 * @returns 格式化后的字符串，如果输入无效则返回 '—'
 */
export function formatDate(value: string | null, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!value) return '—';

  let dateObj: Date | null;

  // 情况 1: 8 位数字格式 (yyyyMMdd)
  if (DATE_TIME_8_DIGITS.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    dateObj = new Date(`${year}-${month}-${day}`);
  }
  // 情况 2: 12 位数字格式 (yyyyMMddHHmm) - 不含秒
  else if (DATE_TIME_12_DIGITS.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    const hour = value.substring(8, 10);
    const minute = value.substring(10, 12);
    dateObj = new Date(`${year}-${month}-${day} ${hour}:${minute}`);
  }
  // 情况 3: 14 位数字格式 (yyyyMMddHHmmss)
  else if (DATE_TIME_14_DIGITS.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    const hour = value.substring(8, 10);
    const minute = value.substring(10, 12);
    const second = value.substring(12, 14);
    dateObj = new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
  }
  // 情况 4-7: 其他格式统一使用 parseDate 处理
  else {
    dateObj = parseDate(value);
  }

  // 如果解析失败，返回破折号
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return '—';
  }

  // 使用指定的格式返回
  return formatDateObject(dateObj, format);
}

/**
 * 获取相对时间描述
 * @param date Date 对象或日期字符串
 * @returns 相对时间描述，如 "刚刚"、"5 分钟前"、"2 小时前"、"昨天" 等
 */
export function getRelativeTime(date: Date | string | null): string {
  if (!date) return '—';

  const now = new Date();
  const target = date instanceof Date ? date : parseDate(date);

  if (!target || Number.isNaN(target.getTime())) {
    return '—';
  }

  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 未来时间
  if (diffMs < 0) {
    if (diffMs > -60 * 1000) return '刚刚';
    if (diffMs > -60 * 60 * 1000) return `${Math.floor(-diffMs / 60000)} 分钟后`;
    if (diffMs > -24 * 60 * 60 * 1000) return `${Math.floor(-diffMs / 3600000)} 小时后`;
    return `${Math.floor(-diffMs / 86400000)} 天后`;
  }

  // 过去时间
  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

/**
 * 判断是否为今天
 * @param date Date 对象或日期字符串
 * @returns true/false
 */
export function isToday(date: Date | string | null): boolean {
  if (!date) return false;

  const target = date instanceof Date ? date : parseDate(date);
  if (!target || Number.isNaN(target.getTime())) {
    return false;
  }

  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

/**
 * 判断是否为昨天
 * @param date Date 对象或日期字符串
 * @returns true/false
 */
export function isYesterday(date: Date | string | null): boolean {
  if (!date) return false;

  const target = date instanceof Date ? date : parseDate(date);
  if (!target || Number.isNaN(target.getTime())) {
    return false;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    target.getFullYear() === yesterday.getFullYear() &&
    target.getMonth() === yesterday.getMonth() &&
    target.getDate() === yesterday.getDate()
  );
}

/**
 * 判断日期范围
 * @param date Date 对象或日期字符串
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns true 表示在范围内，false 表示不在范围内
 */
export function isDateInRange(
  date: Date | string | null,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  if (!date) return false;

  const target = date instanceof Date ? date : parseDate(date);
  const start = startDate instanceof Date ? startDate : parseDate(startDate);
  const end = endDate instanceof Date ? endDate : parseDate(endDate);

  if (!target || !start || !end) {
    return false;
  }

  const targetTime = target.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();

  return targetTime >= startTime && targetTime <= endTime;
}

/**
 * 计算两个日期之间的天数差
 * @param date1 日期 1
 * @param date2 日期 2
 * @returns 天数差（绝对值）
 */
export function getDaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = date1 instanceof Date ? date1 : parseDate(date1);
  const d2 = date2 instanceof Date ? date2 : parseDate(date2);

  if (!d1 || !d2) return 0;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 获取指定日期是一周中的第几天
 * @param date Date 对象或日期字符串
 * @returns 1-7（1 表示周一，7 表示周日）
 */
export function getDayOfWeek(date: Date | string | null): number {
  if (!date) return 0;

  const target = date instanceof Date ? date : parseDate(date);
  if (!target || Number.isNaN(target.getTime())) {
    return 0;
  }

  const day = target.getDay();
  return day === 0 ? 7 : day; // 将周日从 0 改为 7
}

/**
 * 获取指定日期是一年中的第几周
 * @param date Date 对象或日期字符串
 * @returns 周数 (1-53)
 */
export function getWeekOfYear(date: Date | string | null): number {
  if (!date) return 0;

  const target = date instanceof Date ? date : parseDate(date);
  if (!target || Number.isNaN(target.getTime())) {
    return 0;
  }

  const firstDayOfYear = new Date(target.getFullYear(), 0, 1);
  const pastDays = Math.floor((target.getTime() - firstDayOfYear.getTime()) / 86400000);

  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * 格式化持续时间
 * @param milliseconds 毫秒数
 * @param format 格式字符串，默认 'HH:mm:ss'
 * @returns 格式化后的持续时间
 */
export function formatDuration(milliseconds: number, format: string = 'HH:mm:ss'): string {
  if (milliseconds < 0) milliseconds = 0;

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');

  return format.replace('HH', h).replace('mm', m).replace('ss', s);
}

/**
 * 验证日期字符串是否有效
 * @param value 日期字符串
 * @returns true/false
 */
export function isValidDate(value: string | null): boolean {
  if (!value) return false;

  if (
    DATE_TIME_8_DIGITS.test(value) ||
    DATE_TIME_12_DIGITS.test(value) ||
    DATE_TIME_14_DIGITS.test(value) ||
    STANDARD_DATE_TIME.test(value) ||
    STANDARD_DATE_TIME_NO_SECONDS.test(value) ||
    STANDARD_DATE_ONLY.test(value)
  ) {
    return true;
  }

  const date = parseDate(value);
  return date !== null && !Number.isNaN(date.getTime());
}

/**
 * 比较两个日期（忽略时间部分）
 * @param date1 日期 1
 * @param date2 日期 2
 * @returns 0 表示相同，1 表示 date1 晚于 date2，-1 表示 date1 早于 date2
 */
export function compareDates(date1: Date | string, date2: Date | string): number {
  const d1 = date1 instanceof Date ? date1 : parseDate(date1);
  const d2 = date2 instanceof Date ? date2 : parseDate(date2);

  if (!d1 || !d2) return 0;

  const time1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const time2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();

  if (time1 > time2) return 1;
  if (time1 < time2) return -1;
  return 0;
}

/**
 * 日期加减操作
 * @param date 基础日期
 * @param days 天数（正数加，负数减）
 * @returns 新的 Date 对象
 */
export function addDays(date: Date | string, days: number): Date {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return new Date();

  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 月份加减操作
 * @param date 基础日期
 * @param months 月数（正数加，负数减）
 * @returns 新的 Date 对象
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return new Date();

  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 年份加减操作
 * @param date 基础日期
 * @param years 年数（正数加，负数减）
 * @returns 新的 Date 对象
 */
export function addYears(date: Date | string, years: number): Date {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return new Date();

  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
}
