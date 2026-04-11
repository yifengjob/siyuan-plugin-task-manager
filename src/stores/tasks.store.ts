import type { Task, TaskAttrs } from '@/types';
import { defineStore } from 'pinia';
import { taskService } from '@/services/TaskService';
import { ref } from 'vue';
import { handleError } from '@/utils/ErrorHandler';
import { toggleTaskCheckbox } from '@/utils/TaskMarkdownUtils';

/**
 * 任务状态管理 Store
 *
 * @remarks
 * 负责任务数据的加载、更新和状态管理
 * 使用乐观更新策略提升用户体验,失败时自动回滚
 */
export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);

  /**
   * 加载所有任务
   * @throws {Error} 加载失败时抛出错误
   */
  async function loadTasks() {
    try {
      tasks.value = await taskService.getAllTasks();
    } catch (error) {
      handleError(error, { action: 'loadTasks' });
      throw error;
    }
  }

  /**
   * 更新任务属性(乐观更新)
   *
   * @param taskId - 任务 ID
   * @param attrs - 要更新的属性
   * @remarks
   * 1. 先更新本地状态(乐观更新)
   * 2. 同步到服务器
   * 3. 如果失败则回滚本地状态
   */
  async function updateTaskAttributes(taskId: string, attrs: Partial<TaskAttrs>) {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    // 保存原始属性用于回滚
    const originalAttrs = { ...tasks.value[taskIndex].attrs };

    try {
      // 乐观更新
      tasks.value[taskIndex].attrs = {
        ...tasks.value[taskIndex].attrs,
        ...attrs,
      };

      // 同步到服务器
      await taskService.setTaskAttrs(taskId, attrs);
    } catch (error) {
      // 失败时回滚
      tasks.value[taskIndex].attrs = originalAttrs;
      handleError(error, {
        action: 'updateTaskAttributes',
        taskId,
      });
    }
  }

  /**
   * 切换任务完成状态(乐观更新)
   *
   * @param taskId - 任务 ID
   * @param completed - 目标完成状态
   * @remarks
   * 1. 更新任务的 completed 属性
   * 2. 更新 actualDue (实际完成时间)
   * 3. 更新 markdown 中的 checkbox 状态
   * 4. 同步到服务器
   * 5. 失败时回滚所有更改
   */
  async function toggleTaskStatus(taskId: string, completed: boolean) {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    // 保存原始状态用于回滚
    const originalCompleted = tasks.value[taskIndex].attrs.completed;
    const originalActualDue = tasks.value[taskIndex].attrs.actualDue;
    const originalMarkdown = tasks.value[taskIndex].markdown;

    try {
      // 乐观更新：立即更新 UI
      tasks.value[taskIndex].attrs.completed = completed;

      // 更新实际完成时间
      const attrs = taskService.buildTaskCompletedAttrs(completed);
      tasks.value[taskIndex].attrs.actualDue = attrs.actualDue || '';

      // 更新 markdown 内容（checkbox 状态）
      const markdown = tasks.value[taskIndex].markdown;
      if (markdown) {
        tasks.value[taskIndex].markdown = toggleTaskCheckbox(markdown, completed);
      }

      // 同步到服务器
      await taskService.setTaskStatus(taskId, completed);
    } catch (error) {
      // 失败时回滚
      tasks.value[taskIndex].attrs.completed = originalCompleted;
      tasks.value[taskIndex].attrs.actualDue = originalActualDue;
      tasks.value[taskIndex].markdown = originalMarkdown;
      handleError(error, {
        action: 'toggleTaskStatus',
        taskId,
        completed,
      });
      throw error;
    }
  }

  /**
   * 同步任务状态(仅更新属性,不修改 markdown)
   *
   * @param taskId - 任务 ID
   * @param completed - 目标完成状态
   * @remarks
   * 用于 WebSocket 接收到的远程状态变更
   * 与 toggleTaskStatus 不同,此方法不修改 markdown 内容
   */
  async function syncTaskStatus(taskId: string, completed: boolean) {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    // 保存原始状态用于回滚
    const originalAttrs = { ...tasks.value[taskIndex].attrs };

    try {
      // 乐观更新：立即更新 UI
      const attrs = taskService.buildTaskCompletedAttrs(completed);
      tasks.value[taskIndex].attrs = {
        ...tasks.value[taskIndex].attrs,
        ...attrs,
      };

      // 同步到服务器
      await taskService.setTaskAttrs(taskId, attrs);
    } catch (error) {
      // 失败时回滚
      tasks.value[taskIndex].attrs = originalAttrs;
      handleError(error, {
        action: 'syncTaskStatus',
        taskId,
        completed,
      });
      throw error;
    }
  }

  return {
    tasks,
    loadTasks,
    updateTaskAttributes,
    toggleTaskStatus,
    syncTaskStatus,
  };
});
