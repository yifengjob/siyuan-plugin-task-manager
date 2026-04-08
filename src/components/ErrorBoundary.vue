<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import { handleError } from '@/utils/ErrorHandler';

const props = defineProps<{
  name?: string; // 组件名称，用于错误上下文
}>();

const error = ref<Error | null>(null);

onErrorCaptured((err, instance, info) => {
  // 转换为 Error 对象
  const errorObj = err;

  // 记录错误
  handleError(errorObj, {
    context: `ErrorBoundary-${props.name || 'Unknown'}`,
    componentInfo: info,
    componentInstance: instance,
  });

  // 保存错误状态以显示错误 UI
  error.value = errorObj;

  // 阻止错误向上传播
  return false;
});

const handleRetry = () => {
  error.value = null;
};
</script>

<template>
  <div v-if="error" class="error-boundary">
    <div class="error-boundary-content">
      <svg class="error-icon">
        <use xlink:href="#iconError"></use>
      </svg>
      <h3 class="error-title">组件渲染失败</h3>
      <p class="error-message">
        {{ error.message }}
      </p>
      <button
        class="retry-button b3-button b3-button--outline"
        @click="handleRetry"
      >
        重试
      </button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<style scoped lang="scss">
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
  background: var(--b3-theme-surface);
  border-radius: var(--b3-border-radius);
  border: 1px solid var(--b3-border-color);

  .error-boundary-content {
    text-align: center;
    max-width: 400px;

    .error-icon {
      width: 48px;
      height: 48px;
      fill: var(--b3-theme-error);
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--b3-theme-on-surface);
      margin: 0 0 8px 0;
    }

    .error-message {
      font-size: 14px;
      color: var(--b3-theme-on-surface);
      opacity: 0.7;
      margin: 0 0 16px 0;
      word-break: break-word;
    }

    .retry-button {
      padding: 6px 16px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--b3-theme-primary-light);
        border-color: var(--b3-theme-primary);
        color: var(--b3-theme-on-primary-light);
      }
    }
  }
}
</style>
