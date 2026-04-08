import type { Task, TaskAttrs } from '@/types';
import { defineStore } from 'pinia';
import { taskService } from '@/services/TaskService';
import { ref } from 'vue';
import { handleError } from '@/utils/ErrorHandler';
import { toggleTaskCheckbox } from '@/utils/TaskMarkdownUtils';

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);

  async function loadTasks() {
    try {
      tasks.value = await taskService.getAllTasks();
    } catch (error) {
      handleError(error, { action: 'loadTasks' });
      throw error;
    }
  }

  async function updateTaskAttributes(
    taskId: string,
    attrs: Partial<TaskAttrs>
  ) {
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
        tasks.value[taskIndex].markdown = toggleTaskCheckbox(
          markdown,
          completed
        );
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
