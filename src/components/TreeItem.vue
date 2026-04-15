<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import type { TreeNodeBase } from '@/utils/TreeUtils.ts';

interface TreeNode extends TreeNodeBase {
  box?: string;
  childrenLoaded: boolean;
  hasChildren: boolean;
  icon?: string;
  path: string;
}

const props = defineProps<{
  expanded: boolean;
  level: number;
  node: TreeNode;
}>();

const emit = defineEmits<{
  (e: 'update', node: TreeNode): void;
  (e: 'toggle-expand', node: TreeNode): void;
}>();

const checkbox = ref<HTMLInputElement | null>(null);

watch(
  () => props.node.indeterminate,
  async (val) => {
    await nextTick();
    if (checkbox.value) {
      checkbox.value.indeterminate = val;
    }
  },
  { immediate: true }
);

function emitToggleExpand(node: TreeNode) {
  emit('toggle-expand', node);
}

function emitUpdate(node: TreeNode) {
  emit('update', node);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const newNode = {
    ...props.node,
    checked: target.checked,
    indeterminate: false,
  };
  emit('update', newNode);
}

function toggleExpand() {
  emit('toggle-expand', props.node);
}
</script>

<template>
  <div class="tree-item">
    <div class="tree-item-row" :style="{ paddingLeft: level * 16 + 'px' }">
      <span v-if="node.hasChildren" class="tree-toggle" @click.stop="toggleExpand">
        <svg
          class="toggle-icon"
          :class="{ expanded: expanded }"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span v-else class="tree-toggle-placeholder"></span>

      <input ref="checkbox" type="checkbox" :checked="node.checked" @change="handleChange" />

      <span class="tree-item-icon">
        <svg v-if="node.type === 'notebook'" width="16" height="16">
          <use xlink:href="#iconNotebook"></use>
        </svg>
        <svg v-else-if="node.icon" width="16" height="16">
          <use :href="'/emojis/' + node.icon"></use>
        </svg>
        <svg v-else width="16" height="16">
          <use xlink:href="#iconDocument"></use>
        </svg>
      </span>

      <span class="tree-item-name" :title="node.name">
        {{ node.name }}
      </span>
    </div>

    <div v-if="expanded && node.children && node.children.length > 0" class="tree-children">
      <TreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :expanded="child.expanded"
        @update="emitUpdate"
        @toggle-expand="emitToggleExpand"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.tree-item {
  user-select: none;
  font-size: 13px;
  line-height: 1.4;

  .tree-item-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    cursor: default;
    min-height: 28px;

    &:hover {
      background-color: var(--b3-theme-surface);
    }
  }

  .tree-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    cursor: pointer;
    color: var(--b3-theme-on-surface);
    flex-shrink: 0;

    .toggle-icon {
      transition: transform 0.2s ease;
      width: 12px;
      height: 12px;

      &.expanded {
        transform: rotate(90deg);
      }
    }

    &:hover {
      color: var(--b3-theme-primary);
    }
  }

  .tree-toggle-placeholder {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  input[type='checkbox'] {
    margin: 0;
    width: 14px;
    height: 14px;
    accent-color: var(--b3-theme-primary);
    cursor: pointer;
    flex-shrink: 0;
  }

  .tree-item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    flex-shrink: 0;
    color: var(--b3-theme-on-surface);

    svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  }

  .tree-item-name {
    flex: 1;
    color: var(--b3-theme-on-background);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tree-children {
    margin-left: 0; /* 缩进已由父级 paddingLeft 控制，无需额外增加 */
  }
}
</style>
