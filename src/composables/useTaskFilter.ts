import { computed, ref } from 'vue';
import type { Task } from '@/types';
import { useTaskStore } from '@/stores/tasks.store';
import { usePlugin } from '@/utils';
import { FILTER_STATUS } from '@/constants';
import { useTaskSearch } from './useTaskSearch';

/**
 * 任务筛选逻辑 Composable
 * 管理任务的筛选状态和过滤逻辑
 */
export function useTaskFilter() {
  const plugin = usePlugin();
  const taskStore = useTaskStore();

  // 筛选状态
  const filterStatus = ref<string>(plugin.getConfig().defaultProgressGroup);

  // 所有任务
  const allTasks = computed(() => taskStore.tasks);

  // 集成搜索功能
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    searchedTasks,
    hasActiveSearch,
    searchResultCount,
  } = useTaskSearch(allTasks);

  // 根据筛选条件过滤任务（在搜索结果基础上）
  const filteredTasks = computed(() => {
    const tasks = searchedTasks.value;

    if (filterStatus.value === FILTER_STATUS.ALL) {
      return tasks;
    }
    if (filterStatus.value === FILTER_STATUS.COMPLETED) {
      return tasks.filter((task) => task.attrs.completed);
    }
    return tasks.filter((task) => !task.attrs.completed);
  });

  // 按文档分组
  const groups = computed(() => {
    const map = new Map<
      string,
      {
        rootTitle: string;
        rootPath: string;
        boxTitle: string;
        tasks: Task[];
      }
    >();

    filteredTasks.value.forEach((task) => {
      const rootId = task.rootId;
      if (!map.has(rootId)) {
        map.set(rootId, {
          rootTitle: task.rootTitle !== '' ? task.rootTitle : plugin.i18n.untitled,
          rootPath: task.hpath,
          boxTitle: task.boxTitle !== '' ? task.boxTitle : plugin.i18n.untitled,
          tasks: [],
        });
      }
      map.get(rootId)?.tasks.push(task);
    });

    return Array.from(map.entries()).map(([rootId, data]) => ({
      rootId,
      ...data,
    }));
  });

  // 统计数据
  const totalTasks = computed(() => allTasks.value.length);
  const completedTasks = computed(
    () => allTasks.value.filter((t) => t.attrs.completed === true).length
  );
  const incompleteTasks = computed(() => totalTasks.value - completedTasks.value);

  /**
   * 切换筛选状态
   */
  function setFilterStatus(status: string) {
    filterStatus.value = status;
  }

  return {
    filterStatus,
    allTasks,
    filteredTasks,
    groups,
    totalTasks,
    completedTasks,
    incompleteTasks,
    setFilterStatus,
    // 搜索相关
    searchQuery,
    setSearchQuery,
    clearSearch,
    hasActiveSearch,
    searchResultCount,
  };
}
