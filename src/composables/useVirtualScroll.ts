/**
 * 虚拟滚动 Composable
 * 用于优化大数据量列表的渲染性能
 */
import { ref, computed, watch } from 'vue';
import {
  VIRTUAL_SCROLL_THRESHOLD,
  VIRTUAL_ITEM_HEIGHT,
  VIRTUAL_BUFFER_SIZE,
} from '@/constants';

interface UseVirtualScrollOptions {
  itemHeight?: number; // 每个项目的高度（像素）
  bufferSize?: number; // 缓冲区大小（前后各渲染多少个项目）
  threshold?: number; // 启用虚拟滚动的阈值
}

export function useVirtualScroll<T>(
  items: import('vue').ComputedRef<T[]>,
  options: UseVirtualScrollOptions = {}
) {
  const {
    itemHeight = VIRTUAL_ITEM_HEIGHT,
    bufferSize = VIRTUAL_BUFFER_SIZE,
    threshold = VIRTUAL_SCROLL_THRESHOLD,
  } = options;

  // 容器引用
  const containerRef = ref<HTMLElement | null>(null);

  // 滚动位置
  const scrollTop = ref(0);

  // 是否启用虚拟滚动
  const isEnabled = computed(() => items.value.length >= threshold);

  // 总高度
  const totalHeight = computed(() => items.value.length * itemHeight);

  // 可见区域的项目数量
  const visibleCount = computed(() => {
    if (!containerRef.value) return 10; // 默认值
    return Math.ceil(containerRef.value.clientHeight / itemHeight);
  });

  // 起始索引
  const startIndex = computed(() => {
    if (!isEnabled.value) return 0;
    const index = Math.floor(scrollTop.value / itemHeight);
    return Math.max(0, index - bufferSize);
  });

  // 结束索引
  const endIndex = computed(() => {
    if (!isEnabled.value) return items.value.length;
    const index = startIndex.value + visibleCount.value + bufferSize * 2;
    return Math.min(items.value.length, index);
  });

  // 可见的项目
  const visibleItems = computed(() => {
    if (!isEnabled.value) return items.value;
    return items.value.slice(startIndex.value, endIndex.value);
  });

  // 偏移量（用于定位）
  const offsetY = computed(() => {
    if (!isEnabled.value) return 0;
    return startIndex.value * itemHeight;
  });

  // 处理滚动事件
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    scrollTop.value = target.scrollTop;
  };

  // 清理函数
  let cleanupListener: (() => void) | null = null;

  // 监听容器尺寸变化
  watch(
    containerRef,
    (newVal, _oldVal) => {
      // 清理旧的监听器
      if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
      }

      // 添加新的监听器
      if (newVal) {
        newVal.addEventListener('scroll', handleScroll, {
          passive: true,
        });
        cleanupListener = () => {
          newVal.removeEventListener('scroll', handleScroll);
        };
      }
    },
    { immediate: true }
  );

  // 清理
  const cleanup = () => {
    if (cleanupListener) {
      cleanupListener();
      cleanupListener = null;
    }
  };

  return {
    containerRef,
    isEnabled,
    totalHeight,
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    cleanup,
  };
}
