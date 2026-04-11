import { ref, onMounted, onUnmounted } from 'vue';
import type { IWebSocketData } from 'siyuan';
import { useTaskStore } from '@/stores/tasks.store';
import { usePlugin } from '@/utils';
import { handleError } from '@/utils/ErrorHandler';
import {
  THROTTLE_DELAY,
  DEBOUNCE_DELAY,
  MAX_CACHED_BLOCK_IDS,
  CACHE_EXPIRY_TIME,
  CACHE_CLEANUP_INTERVAL,
} from '@/constants';

/**
 * 任务数据加载和同步逻辑 Composable
 * 管理任务的加载、刷新和 WebSocket 同步
 */
export function useTaskSync() {
  const plugin = usePlugin();
  const taskStore = useTaskStore();

  // 加载状态
  const isLoading = ref(false);
  const loadError = ref<string | null>(null);

  // 缓存已处理的块 ID，用于节流
  const processedBlockIds = new Map<string, number>();

  // 刷新定时器
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 清理过期的缓存
   */
  const cleanupExpiredCache = () => {
    const now = Date.now();
    for (const [blockId, timestamp] of processedBlockIds.entries()) {
      if (now - timestamp > CACHE_EXPIRY_TIME) {
        processedBlockIds.delete(blockId);
      }
    }
  };

  /**
   * 加载任务
   */
  const loadTasks = async () => {
    try {
      isLoading.value = true;
      loadError.value = null;
      await taskStore.loadTasks();
    } catch (error) {
      handleError(error, { action: 'loadTasks' });
      loadError.value = '加载任务失败，请刷新重试';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 手动刷新
   */
  const handleRefresh = async () => {
    await loadTasks();
  };

  /**
   * 防抖刷新
   */
  const debouncedRefresh = async () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    return new Promise<void>((resolve, reject) => {
      refreshTimer = setTimeout(async () => {
        try {
          loadError.value = null;
          await taskStore.loadTasks();
          resolve();
        } catch (error) {
          handleError(error, { action: 'debouncedRefresh' });
          loadError.value = '刷新失败，请稍后重试';
          reject(error);
        } finally {
          refreshTimer = null;
        }
      }, DEBOUNCE_DELAY);
    });
  };

  /**
   * 处理 WebSocket 消息
   */
  const handleWsMain = async (event: CustomEvent<IWebSocketData>) => {
    const detail = event.detail;
    if (!detail) return;

    // 处理文档级别的操作
    const supportedCommands = ['removeDoc', 'create', 'moveDoc', 'rename', 'copyDoc'];
    if (detail.cmd && supportedCommands.includes(detail.cmd)) {
      await debouncedRefresh();
      return;
    }

    // 处理事务操作
    if (detail.cmd && detail.cmd !== 'transactions') {
      return;
    }
    if (!detail.data || !Array.isArray(detail.data)) return;

    let needsRefresh = false;
    const supportedActions = ['update', 'delete', 'insert', 'move', 'save'];

    try {
      for (const item of detail.data) {
        if (!item.doOperations || !Array.isArray(item.doOperations)) continue;

        for (const op of item.doOperations) {
          if (!op.action || !supportedActions.includes(op.action)) continue;

          // 特殊处理任务更新
          if (
            op.action === 'update' &&
            op.data &&
            op.data.startsWith('<div data-marker="*" data-subtype="t" data-node-id="') &&
            op.data.includes('data-subtype="t"') &&
            op.data.includes('data-type="NodeListItem"')
          ) {
            const blockId = op.id;
            if (!blockId) continue;

            // 节流检查
            const now = Date.now();
            const lastProcessedTime = processedBlockIds.get(blockId) || 0;
            if (now - lastProcessedTime < THROTTLE_DELAY) {
              continue;
            }

            const taskCompleted = op.data.includes(`class="li protyle-task--done"`);

            // 更新缓存
            processedBlockIds.set(blockId, now);

            // 限制缓存大小
            if (processedBlockIds.size > MAX_CACHED_BLOCK_IDS) {
              const firstKey = processedBlockIds.keys().next().value;
              if (firstKey) processedBlockIds.delete(firstKey);
            }

            // 定期清理过期缓存
            if (processedBlockIds.size % CACHE_CLEANUP_INTERVAL === 0) {
              cleanupExpiredCache();
            }

            // 同步任务状态
            await taskStore.syncTaskStatus(blockId, taskCompleted);
            continue;
          }

          needsRefresh = true;
        }
      }

      if (needsRefresh) {
        await debouncedRefresh().catch((error) => {
          handleError(error, { action: 'debouncedRefresh' });
        });
      }
    } catch (error) {
      handleError(error, { action: 'handleWsMain' });
    }
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    processedBlockIds.clear();
  };

  // 生命周期钩子
  onMounted(async () => {
    await loadTasks();
    plugin.eventBus.on('ws-main', handleWsMain);
  });

  onUnmounted(() => {
    plugin.eventBus.off('ws-main', handleWsMain);
    cleanup();
  });

  return {
    isLoading,
    loadError,
    loadTasks,
    handleRefresh,
    debouncedRefresh,
    handleWsMain,
    cleanup,
  };
}
