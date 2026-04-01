import { apiService, ApiService } from '@/services/ApiService.ts';
import { BlockId, BlockInfo, Task, TaskAttrs } from '@/types';
import { DataType } from '@/types/api.ts';
import { TaskAttribute } from '@/types/task.ts';
import { usePlugin } from '@/utils/pluginInstance.ts';

export class TaskService {
    constructor(private api: ApiService) {}

    async getAllTasks(): Promise<Task[]> {
        await apiService.flushTransaction();

        const plugin = usePlugin();
        const filteredNotebooks = plugin.getConfig().filteredNotebooks || [];
        const filteredBlocks = plugin.getConfig().filteredBlocks || [];

        // 构建过滤条件 - 使用参数化占位符
        let whereClause = `WHERE b.type = 'i' AND b.subtype = 't'`;
        const params: Record<string, string> = {};

        // 添加笔记本过滤条件
        if (filteredNotebooks && filteredNotebooks.length > 0) {
            const notebookPlaceholders = filteredNotebooks
                .map((_box, index) => `{{nb${index}}}`)
                .join(',');
            whereClause += ` AND b.box NOT IN (${notebookPlaceholders})`;

            // 添加参数
            filteredNotebooks.forEach((box, index) => {
                params[`nb${index}`] = box;
            });
        }

        // 添加块过滤条件
        if (filteredBlocks && filteredBlocks.length > 0) {
            const blockPlaceholders = filteredBlocks
                .map((_blockId, index) => `{{blk${index}}}`)
                .join(',');
            whereClause += ` AND b.id NOT IN (${blockPlaceholders})`;

            // 添加参数
            filteredBlocks.forEach((blockId, index) => {
                params[`blk${index}`] = blockId;
            });
        }

        const sqlStmt = `SELECT b.id,
                                b.box,
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

        const rows: { [key: string]: string }[] = await this.api.sql(
            sqlStmt,
            params
        );

        // 性能优化：只在有数据时才获取笔记本列表
        if (!rows || rows.length === 0) return [];

        const books = await this.api.lsNotebooks();
        const notebookMap = new Map(books.notebooks.map((n) => [n.id, n.name]));

        return rows.map((row: { [key: string]: string }) => ({
            id: row.id,
            box: row.box,
            boxTitle: notebookMap.get(row.box) || '',
            hpath: row.hpath,
            rootId: row.root_id,
            rootTitle: row.root_title || '',
            content: row.content,
            markdown: row.markdown,
            created: row.created,
            updated: row.updated,
            attrs: this.parseIalAttrs(row.ial),
        }));
    }

    /**
     * 从 ial 字段字符串中解析出属性对象
     */
    private parseIalAttrs(ial: string): TaskAttrs {
        const attrs: TaskAttrs = {
            start: '',
            planDue: '',
            actualDue: '',
            priority: 'normal',
            notes: '',
            completed: false,
        };

        if (!ial) return attrs;

        // 解析 ial 字段格式：{: key="value" key2="value2"}
        const regex = /custom-siyuan-plugin-task-manager-task-(\w+)="([^"]*)"/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(ial)) !== null) {
            const [, key, value] = match;
            switch (key) {
                case 'start':
                    attrs.start = value;
                    break;
                case 'plandue':
                    attrs.planDue = value;
                    break;
                case 'actualdue':
                    attrs.actualDue = value;
                    break;
                case 'priority':
                    attrs.priority = value;
                    break;
                case 'notes':
                    attrs.notes = value;
                    break;
                case 'completed':
                    attrs.completed = value === 'true';
                    break;
            }
        }

        return attrs;
    }

    async updateTask(id: BlockId, markdown: string) {
        await this.api.updateBlock(DataType.markdown, markdown, id);
    }

    async getTaskAttrs(blockId: string): Promise<TaskAttrs> {
        const attrs = await this.api.getBlockAttrs(blockId);
        const completed = attrs[TaskAttribute.completed] === 'true';
        return {
            start: attrs[TaskAttribute.start] || '',
            planDue: attrs[TaskAttribute.planDue] || '',
            actualDue: attrs[TaskAttribute.actualDue] || '',
            priority: attrs[TaskAttribute.priority] || 'normal',
            notes: attrs[TaskAttribute.notes] || '',
            completed,
        };
    }

    async setTaskAttrs(blockId: string, attrs: Partial<TaskAttrs>) {
        const toSave: Record<string, string> = {};
        if (attrs.start !== undefined)
            toSave[TaskAttribute.start] = attrs.start;
        if (attrs.planDue !== undefined)
            toSave[TaskAttribute.planDue] = attrs.planDue;
        if (attrs.actualDue !== undefined)
            toSave[TaskAttribute.actualDue] = attrs.actualDue;
        if (attrs.priority !== undefined)
            toSave[TaskAttribute.priority] = attrs.priority;
        if (attrs.notes !== undefined)
            toSave[TaskAttribute.notes] = attrs.notes;
        if (attrs.completed !== undefined)
            toSave[TaskAttribute.completed] = attrs.completed ? 'true' : '';
        await this.api.setBlockAttrs(blockId, toSave);
    }

    async getTaskMarkdown(blockId: string): Promise<string | null> {
        return this.api.getBlockMarkdown(blockId);
    }

    async getTaskStatus(blockId: BlockId): Promise<boolean> {
        const markdown = await this.getTaskMarkdown(blockId);
        return markdown?.startsWith('- [X]') ?? false;
    }
    async getBlockCreated(blockId: string) {
        return this.api.getBlockCreated(blockId);
    }

    async getTaskInfo(blockId: BlockId): Promise<BlockInfo | null> {
        return this.api.getBlockInfo(blockId);
    }

    async openTask(blockId: BlockId) {
        await this.api.openBlock(blockId);
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
                console.warn(
                    `[TaskService] Failed to get markdown for task ${blockId}`
                );
                return;
            }

            let newMarkdown = markdown;
            if (completed) {
                newMarkdown = newMarkdown.replace(/^-\s*\[\s*]/, '- [X]');
            } else {
                newMarkdown = newMarkdown.replace(/^-\s*\[X]/i, '- [ ]');
            }

            if (newMarkdown === markdown) {
                // 状态未改变，无需更新
                return;
            }

            await this.updateTask(blockId, newMarkdown);

            // 更新属性
            const completeAttrs = this.buildTaskCompletedAttrs(completed);
            originalAttrs[TaskAttribute.completed] = completeAttrs.completed
                ? 'true'
                : '';
            originalAttrs[TaskAttribute.actualDue] = completeAttrs.actualDue;

            await this.api.setBlockAttrs(blockId, originalAttrs);
        } catch (error) {
            console.error(
                `[TaskService] Failed to set task status for ${blockId}:`,
                error
            );
            throw error;
        }
    }
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
}

export const taskService = new TaskService(apiService);
