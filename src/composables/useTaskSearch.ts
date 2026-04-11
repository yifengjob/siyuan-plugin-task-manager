import { ref, computed, type ComputedRef } from 'vue';
import type { Task } from '@/types';

/**
 * 任务搜索逻辑 Composable
 * 提供全文搜索和过滤功能
 */
export function useTaskSearch(allTasks: ComputedRef<Task[]>) {
  // 搜索关键词
  const searchQuery = ref('');

  // 防抖定时器
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 设置搜索关键词（带防抖）
   */
  const setSearchQuery = (query: string) => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      searchQuery.value = query.trim();
    }, 300);
  };

  /**
   * 清除搜索
   */
  const clearSearch = () => {
    searchQuery.value = '';
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
  };

  /**
   * 搜索匹配函数
   * 支持多字段模糊搜索
   */
  const matchesSearch = (task: Task, query: string): boolean => {
    if (!query) return true;

    const lowerQuery = query.toLowerCase();

    // 搜索任务内容
    if (task.content?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 搜索备注
    if (task.attrs.notes?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 搜素文档标题
    if (task.rootTitle?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 搜索笔记本标题
    if (task.boxTitle?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 搜索路径
    return !!task.hpath?.toLowerCase().includes(lowerQuery);
  };

  /**
   * 根据搜索条件过滤任务
   */
  const searchedTasks = computed(() => {
    if (!searchQuery.value) {
      return allTasks.value;
    }

    return allTasks.value.filter((task) => matchesSearch(task, searchQuery.value));
  });

  /**
   * 是否有活跃的搜索
   */
  const hasActiveSearch = computed(() => !!searchQuery.value);

  /**
   * 搜索结果数量
   */
  const searchResultCount = computed(() => searchedTasks.value.length);

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    searchedTasks,
    hasActiveSearch,
    searchResultCount,
    matchesSearch,
  };
}
