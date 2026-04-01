import type { Task, TaskAttrs } from '@/types';
import { defineStore } from 'pinia';
import { taskService } from '@/services/TaskService.ts';
import { ref } from 'vue';

export const useTaskStore = defineStore('tasks', () => {
    const tasks = ref<Task[]>([]);

    async function loadTasks() {
        tasks.value = await taskService.getAllTasks();
    }

    async function updateTaskAttributes(
        taskId: string,
        attrs: Partial<TaskAttrs>
    ) {
        await taskService.setTaskAttrs(taskId, attrs);
        // 更新本地数据
        const task = tasks.value.find((t) => t.id === taskId);
        if (task) {
            Object.assign(task.attrs, attrs);
        }
    }

    async function toggleTaskStatus(taskId: string, completed: boolean) {
        await taskService.setTaskStatus(taskId, completed);
        await updateLocalTask(taskId, completed);
    }

    async function syncTaskStatus(taskId: string, completed: boolean) {
        const attrs = taskService.buildTaskCompletedAttrs(completed);
        await taskService.setTaskAttrs(taskId, attrs);
        await updateLocalTask(taskId, attrs);
    }
    async function updateLocalTask(
        taskId: string,
        attrs: Partial<TaskAttrs> | boolean,
        taskContent?: string
    ) {
        // 更新本地数据
        const task = tasks.value.find((t) => t.id === taskId);
        if (task) {
            const updatedAttrs =
                typeof attrs === 'boolean'
                    ? taskService.buildTaskCompletedAttrs(attrs)
                    : attrs;

            task.attrs = {
                ...task.attrs,
                ...updatedAttrs,
            };
            task.content = taskContent || task.content;
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
