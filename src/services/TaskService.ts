import { apiService, ApiService } from '@/services/ApiService';
import {
  BlockId,
  BlockInfo,
  DataType,
  Task,
  TASK_ATTR_PREFIX,
  TaskAttribute,
  TaskAttrs,
} from '@/types';
import { AppError, buildNotInClause, parseDate, usePlugin } from '@/utils';
import { ErrorLevel, handleError } from '@/utils/ErrorHandler';
import { isTaskCompleted, toggleTaskCheckbox } from '@/utils/TaskMarkdownUtils';

// 预编译正则表达式,提升性能
const TASK_ATTR_REGEX = new RegExp(`${TASK_ATTR_PREFIX}(\\w+)="([^"]*)"`, 'g');

export class TaskService {
  constructor(private api: ApiService) {}

  buildTaskCompletedAttrs(completed: boolean) {
    const attrs: Partial<TaskAttrs> = { completed };
    if (completed) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      attrs.actualDue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else {
      attrs.actualDue = '';
    }
    return attrs;
  }

  async getAllTasks(): Promise<Task[]> {
    await apiService.flushTransaction();

    const plugin = usePlugin();
    const filteredNotebooks = plugin.getConfig().filteredNotebooks || [];
    const filteredBlocks = plugin.getConfig().filteredBlocks || [];

    // 构建过滤条件
    let whereClause = `WHERE b.type = 'i' AND b.subtype = 't'`;

    // 添加笔记本过滤条件
    if (filteredNotebooks.length > 0) {
      whereClause += ` AND ${buildNotInClause('b.box', filteredNotebooks)}`;
    }

    // 添加块过滤条件
    if (filteredBlocks.length > 0) {
      whereClause += ` AND ${buildNotInClause('b.id', filteredBlocks)}`;
      whereClause += ` AND ${buildNotInClause('b.root_id', filteredBlocks)}`;
    }

    const sqlStmt = `SELECT b.id,
                            b.box,
                            b.path,
                            b.hpath,
                            b.root_id,
                            b.content,
                            b.markdown,
                            b.created,
                            b.updated,
                            b.ial,
                            d.fcontent as root_title
                     FROM blocks b
                            INNER JOIN blocks d ON b.root_id = d.id
                       ${whereClause}
                     ORDER BY b.created ASC`;

    // 执行查询
    const queryStartTime = performance.now();
    let rows: { [key: string]: string }[];
    try {
      rows = await this.api.sql(sqlStmt);
    } catch (error) {
      handleError(error, {
        action: 'getAllTasks.sql',
        sql: sqlStmt,
      });
      return [];
    }

    // 性能监控
    const queryDuration = performance.now() - queryStartTime;
    if (queryDuration > 100) {
      handleError(
        new AppError(`慢查询: ${queryDuration.toFixed(2)}ms`),
        {
          action: 'getAllTasks',
          filteredBlocks: filteredBlocks.length,
          filteredNotebooks: filteredNotebooks.length,
          level: ErrorLevel.WARN,
          resultCount: rows?.length || 0,
        },
        false
      );
    }

    if (!rows || rows.length === 0) return [];

    // 获取笔记本映射
    const filterStartTime = performance.now();
    const books = await this.api.lsNotebooks();
    const notebookMap = new Map(books.notebooks.map((n) => [n.id, n.name]));

    // JS 层过滤：处理层级关系
    const filteredNotebookSet = new Set(filteredNotebooks);
    const filteredBlockSet = new Set(filteredBlocks);

    const filtered = rows.filter((row) => {
      // 检查路径中是否包含被过滤的笔记本或块
      for (const boxId of filteredNotebookSet) {
        if (row.path.includes(boxId)) return false;
      }
      for (const blockId of filteredBlockSet) {
        if (row.path.includes(blockId)) return false;
      }
      return true;
    });

    // 性能监控
    const filterDuration = performance.now() - filterStartTime;
    if (filterDuration > 50) {
      handleError(
        new AppError(`JS过滤慢: ${filterDuration.toFixed(2)}ms`),
        {
          action: 'getAllTasks.filter',
          filteredRows: filtered.length,
          level: ErrorLevel.WARN,
          totalRows: rows.length,
        },
        false
      );
    }

    const tasks = filtered.map((row) => ({
      attrs: this.parseIalAttrs(row.ial),
      box: row.box,
      boxTitle: notebookMap.get(row.box) || '',
      content: row.content,
      created: row.created,
      hpath: row.hpath,
      id: row.id,
      markdown: row.markdown,
      rootId: row.root_id,
      rootTitle: row.root_title || '',
      updated: row.updated,
    }));

    // 按 planDue 升序排序，空值排在后面
    const sortStartTime = performance.now();
    const datetimeFormatPattern = plugin.getConfig().datetimeFormatPattern;

    // 预解析所有日期，避免在排序比较中重复解析
    const dateCache = new Map<string, Date | null>();
    const getDate = (planDue: string): Date | null => {
      if (!planDue) return null;
      let cached = dateCache.get(planDue);
      if (cached === undefined) {
        cached = parseDate(planDue, datetimeFormatPattern);
        dateCache.set(planDue, cached);
      }
      return cached;
    };

    tasks.sort((a, b) => {
      const dateA = getDate(a.attrs.planDue);
      const dateB = getDate(b.attrs.planDue);

      // 如果两者都为空，保持原顺序
      if (!dateA && !dateB) return 0;
      // 如果只有 a 为空，a 排在后面
      if (!dateA) return 1;
      // 如果只有 b 为空，b 排在后面
      if (!dateB) return -1;

      // 两者都有值，按日期升序比较
      return dateA.getTime() - dateB.getTime();
    });

    // 性能监控
    const sortDuration = performance.now() - sortStartTime;
    if (sortDuration > 50) {
      handleError(
        new AppError(`排序慢: ${sortDuration.toFixed(2)}ms`),
        {
          action: 'getAllTasks.sort',
          level: ErrorLevel.WARN,
          taskCount: tasks.length,
          uniqueDates: dateCache.size,
        },
        false
      );
    }

    return tasks;
  }

  async getBlockCreated(blockId: string) {
    return this.api.getBlockCreated(blockId);
  }

  async getTaskAttrs(blockId: string): Promise<TaskAttrs> {
    const attrs = await this.api.getBlockAttrs(blockId);
    const completed = attrs[TaskAttribute.completed] === 'true';
    return {
      actualDue: attrs[TaskAttribute.actualDue] || '',
      completed,
      notes: attrs[TaskAttribute.notes] || '',
      planDue: attrs[TaskAttribute.planDue] || '',
      priority: attrs[TaskAttribute.priority] || 'normal',
      start: attrs[TaskAttribute.start] || '',
    };
  }

  async getTaskInfo(blockId: BlockId): Promise<BlockInfo | null> {
    return this.api.getBlockInfo(blockId);
  }

  async getTaskMarkdown(blockId: string): Promise<null | string> {
    return this.api.getBlockMarkdown(blockId);
  }

  async getTaskStatus(blockId: BlockId): Promise<boolean> {
    const markdown = await this.getTaskMarkdown(blockId);
    return isTaskCompleted(markdown);
  }
  async openTask(blockId: BlockId) {
    await this.api.openBlock(blockId);
  }

  async setTaskAttrs(blockId: string, attrs: Partial<TaskAttrs>) {
    const toSave: Record<string, string> = {};
    if (attrs.start !== undefined) toSave[TaskAttribute.start] = attrs.start;
    if (attrs.planDue !== undefined) toSave[TaskAttribute.planDue] = attrs.planDue;
    if (attrs.actualDue !== undefined) toSave[TaskAttribute.actualDue] = attrs.actualDue;
    if (attrs.priority !== undefined) toSave[TaskAttribute.priority] = attrs.priority;
    if (attrs.notes !== undefined) toSave[TaskAttribute.notes] = attrs.notes;
    if (attrs.completed !== undefined)
      toSave[TaskAttribute.completed] = attrs.completed ? 'true' : '';
    await this.api.setBlockAttrs(blockId, toSave);
  }

  /**
   * 设置任务的完成状态并更新相关属性
   *
   * 该方法会执行以下操作：
   * 1. 保存任务块的现有属性
   * 2. 更新任务的 Markdown 内容（checkbox 状态）
   * 3. 更新任务现有属性的完成状态和实际完成日期属性
   * 4. 将任务原有的属性写回数据库
   *
   * @param blockId - 任务块的 ID
   * @param completed - 完成状态，true 表示已完成，false 表示未完成
   * @returns 无返回值，如果获取 Markdown 失败则提前返回
   */
  async setTaskStatus(blockId: BlockId, completed: boolean) {
    try {
      // 获取原始属性
      const originalAttrs = await this.api.getBlockAttrs(blockId);

      const markdown = await this.getTaskMarkdown(blockId);
      if (!markdown) {
        handleError(
          new Error(`获取任务 markdown 失败: ${blockId}`),
          { action: 'getTaskMarkdown', blockId },
          false
        );
        return;
      }

      const newMarkdown = toggleTaskCheckbox(markdown, completed);

      if (newMarkdown === markdown) {
        // 状态未改变，无需更新
        return;
      }

      await this.updateTask(blockId, newMarkdown);

      // 更新属性
      const completeAttrs = this.buildTaskCompletedAttrs(completed);
      originalAttrs[TaskAttribute.completed] = completeAttrs.completed ? 'true' : '';
      originalAttrs[TaskAttribute.actualDue] = completeAttrs.actualDue || '';

      await this.api.setBlockAttrs(blockId, originalAttrs);
    } catch (error) {
      handleError(error, {
        action: 'setTaskStatus',
        blockId,
        completed,
      });
      throw error;
    }
  }

  async updateTask(id: BlockId, markdown: string) {
    await this.api.updateBlock(DataType.markdown, markdown, id);
  }
  /**
   * 从 ial 字段字符串中解析出属性对象
   */
  private parseIalAttrs(ial: string): TaskAttrs {
    const attrs: TaskAttrs = {
      actualDue: '',
      completed: false,
      notes: '',
      planDue: '',
      priority: 'normal',
      start: '',
    };

    if (!ial) return attrs;

    // 解析 ial 字段格式：{: key="value" key2="value2"}
    // 使用预编译的正则表达式提升性能
    let match: null | RegExpExecArray;
    // 重置正则的 lastIndex,确保从头开始匹配
    TASK_ATTR_REGEX.lastIndex = 0;

    while ((match = TASK_ATTR_REGEX.exec(ial)) !== null) {
      const [, key, value] = match;
      switch (key) {
        case 'actualdue':
          attrs.actualDue = value;
          break;
        case 'completed':
          attrs.completed = value === 'true';
          break;
        case 'notes':
          attrs.notes = value;
          break;
        case 'plandue':
          attrs.planDue = value;
          break;
        case 'priority':
          attrs.priority = value;
          break;
        case 'start':
          attrs.start = value;
          break;
      }
    }

    return attrs;
  }
}

export const taskService = new TaskService(apiService);
