// ============ 任务属性常量 ============

/**
 * 任务属性名前缀
 * @remarks
 * 用于构建完整的属性键名,如: custom-siyuan-plugin-task-manager-task-start
 */
export const TASK_ATTR_PREFIX = 'custom-siyuan-plugin-task-manager-task-';

/**
 * 任务属性枚举
 * @remarks
 * 所有属性值都基于 TASK_ATTR_PREFIX 构建,保持单一数据源
 */
export enum TaskAttribute {
  actualDue = `${TASK_ATTR_PREFIX}actualdue`,
  completed = `${TASK_ATTR_PREFIX}completed`,
  notes = `${TASK_ATTR_PREFIX}notes`,
  planDue = `${TASK_ATTR_PREFIX}plandue`,
  priority = `${TASK_ATTR_PREFIX}priority`,
  start = `${TASK_ATTR_PREFIX}start`,
}
