<script setup lang="ts">
import { onMounted, ref } from 'vue';

import type { I18n } from '@/types';
import type { PluginConfigManager } from '@/utils';

import { apiService } from '@/services/ApiService';
import {
  findNode,
  findPath,
  setAllExpanded,
  setChildrenChecked,
  type TreeNodeBase,
  updateIndeterminateState,
} from '@/utils';
import { handleError } from '@/utils/ErrorHandler';

const props = defineProps<{
  configManager: PluginConfigManager;
  i18n: I18n;
}>();

const loading = ref(true);
const error = ref<null | string>(null);
const treeData = ref<TreeNode[]>([]);
const loadingProgress = ref<number>(0); // 新增：加载进度
const loadingStatus = ref<string>(''); // 新增：加载状态信息

// 配置常量
const BATCH_CONCURRENCY_LIMIT = 5; // 并发加载限制
const MAX_RETRY_ATTEMPTS = 3; // 最大重试次数
const RETRY_BASE_DELAY = 500; // 重试基础延迟（毫秒）

interface TreeNode extends TreeNodeBase {
  box?: string;
  childrenLoaded: boolean;
  hasChildren: boolean;
  icon?: string;
  path: string;
}
function collapseAll() {
  setAllExpanded(treeData.value, false);
  treeData.value = [...treeData.value];
}

async function expandAll() {
  await loadAllChildren(treeData.value);
  setAllExpanded(treeData.value, true);
  treeData.value = [...treeData.value];
}

async function handleNodeUpdate(updatedNode: TreeNode) {
  const target = findNode(treeData.value, updatedNode.id, updatedNode.type);
  if (!target) return;

  target.checked = updatedNode.checked;
  target.indeterminate = false;

  if (updatedNode.checked) {
    // 勾选时：加载并勾选所有后代
    await loadAllDescendants(target);
    setChildrenChecked(target, true);
  } else {
    // 取消勾选时：只需取消当前节点，子节点会自动取消（setChildrenChecked）
    setChildrenChecked(target, false);
  }

  // 关键修复：重新计算整棵树的半选状态，确保所有祖先节点状态正确
  updateIndeterminateState(treeData.value);

  await updateConfig();
  treeData.value = [...treeData.value];
}

function handleToggleExpand(node: TreeNode) {
  if (!node.childrenLoaded && node.hasChildren) {
    loadChildren(node).then(() => {
      node.expanded = true;
      treeData.value = [...treeData.value];
    });
  } else {
    node.expanded = !node.expanded;
    treeData.value = [...treeData.value];
  }
}

/**
 * 初始化树的勾选状态
 * 策略：
 * 1. 先应用笔记本的勾选状态
 * 2. 再应用文档块的勾选状态（但如果父节点已勾选则跳过）
 * 3. 最后计算半选状态
 */
function initCheckedState(
  nodes: TreeNode[],
  filteredNotebooks: string[],
  filteredBlocks: string[]
) {
  // 第一步：设置笔记本的勾选状态
  for (const node of nodes) {
    if (node.type === 'notebook') {
      node.checked = filteredNotebooks.includes(node.id);
      node.indeterminate = false;
    }
    initCheckedState(node.children, filteredNotebooks, filteredBlocks);
  }

  // 第二步：设置文档块的勾选状态
  const applyBlockChecked = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'doc') {
        // 只有当父节点没有被勾选时，才应用 filteredBlocks 配置
        const parentChecked = isParentCheckedInInit(node, filteredNotebooks, filteredBlocks);
        if (!parentChecked) {
          node.checked = filteredBlocks.includes(node.id);
          node.indeterminate = false;
        }
      }
      applyBlockChecked(node.children);
    }
  };
  applyBlockChecked(nodes);

  // 第三步：如果笔记本被勾选，强制其所有后代都被勾选
  const enforceNotebookChecked = (node: TreeNode) => {
    if (node.type === 'notebook' && node.checked) {
      setChildrenChecked(node, true);
    } else {
      for (const child of node.children) {
        enforceNotebookChecked(child);
      }
    }
  };
  for (const node of nodes) {
    enforceNotebookChecked(node);
  }
}

/**
 * 检查节点的父节点是否被勾选
 */
function isParentChecked(node: TreeNode): boolean {
  const path = findPath(treeData.value, node.id, node.type);
  if (!path || path.length < 2) return false;

  // 检查所有祖先节点是否有被勾选的
  for (let i = 0; i < path.length - 1; i++) {
    if (path[i].checked && !path[i].indeterminate) {
      return true;
    }
  }
  return false;
}

/**
 * 在初始化时检查节点的父节点是否在配置中被勾选
 */
function isParentCheckedInInit(
  node: TreeNode,
  filteredNotebooks: string[],
  filteredBlocks: string[]
): boolean {
  const path = findPath(treeData.value, node.id, node.type);
  if (!path || path.length < 2) return false;

  // 检查所有祖先节点
  for (let i = 0; i < path.length - 1; i++) {
    const ancestor = path[i];
    if (ancestor.type === 'notebook') {
      if (filteredNotebooks.includes(ancestor.id)) {
        return true;
      }
    } else {
      if (filteredBlocks.includes(ancestor.id)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 递归加载所有节点的子节点（用于展开全部）
 */
async function loadAllChildren(nodes: TreeNode[]) {
  for (const node of nodes) {
    if (node.hasChildren && !node.childrenLoaded) {
      await loadChildren(node);
    }
    if (node.children.length) {
      await loadAllChildren(node.children);
    }
  }
}

async function loadAllDescendants(node: TreeNode) {
  if (!node.childrenLoaded && node.hasChildren) {
    await loadChildren(node);
  }
  for (const child of node.children) {
    await loadAllDescendants(child);
  }
}

async function loadChildren(node: TreeNode) {
  if (node.childrenLoaded) return;

  try {
    let notebookId: string;
    let path: string;

    if (node.type === 'notebook') {
      notebookId = node.id;
      path = '/';
    } else {
      if (!node.box) {
        handleError(
          new Error(`Document node ${node.id} missing box property`),
          { action: 'loadChildren', nodeId: node.id },
          false
        );
        node.childrenLoaded = true;
        node.hasChildren = false;
        return;
      }
      notebookId = node.box;
      path = node.path;
    }

    const result = await apiService.listDocsByPath(notebookId, path);
    if (!result?.files) {
      node.childrenLoaded = true;
      node.hasChildren = false;
      return;
    }

    const existingChildrenMap = new Map(node.children.map((c) => [c.id, c]));
    const config = props.configManager.getConfig();
    const filteredBlocks = config.filteredBlocks || [];

    const newChildren = result.files.map((file) => {
      const existing = existingChildrenMap.get(file.id);
      let checked = existing ? existing.checked : false;
      if (!existing) {
        checked = filteredBlocks.includes(file.id);
      }
      return {
        box: notebookId,
        checked,
        children: [],
        childrenLoaded: existing ? existing.childrenLoaded : false,
        expanded: existing ? existing.expanded : false,
        hasChildren: file.subFileCount > 0,
        icon: file.icon || '',
        id: file.id,
        indeterminate: false,
        name: file.name.replace(/\.sy$/, ''),
        path: file.path,
        type: 'doc' as const,
      };
    });

    node.children = newChildren;
    node.childrenLoaded = true;
    node.hasChildren = newChildren.length > 0;
  } catch (err) {
    handleError(err, { action: 'loadChildren', nodeId: node.id }, false);
    node.childrenLoaded = true;
    node.hasChildren = false;
  }
}

/**
 * 带重试机制的节点加载函数
 * 使用指数退避策略进行重试
 */
async function loadChildrenWithRetry(
  node: TreeNode,
  maxRetries: number = MAX_RETRY_ATTEMPTS,
  baseDelay: number = RETRY_BASE_DELAY
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await loadChildren(node);
      if (node.childrenLoaded) {
        return; // 成功加载
      }
    } catch (err) {
      handleError(
        err,
        {
          action: 'loadChildrenWithRetry',
          attempt: attempt + 1,
          maxRetries,
          nodeId: node.id,
        },
        false
      );

      if (attempt < maxRetries) {
        // 指数退避：500ms, 1000ms, 2000ms...
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败后，标记为已加载但无子节点（降级策略）
  handleError(
    new Error(`所有重试尝试均失败: ${node.id}`),
    { action: 'loadChildrenWithRetry', nodeId: node.id },
    false
  );
  node.childrenLoaded = true;
  node.hasChildren = false;
}
/**
 * 加载树中所有节点的完整子节点列表，确保半选状态计算准确
 * 性能优化：
 * 1. 使用并发控制批量加载
 * 2. 带重试机制的错误处理
 * 3. 进度反馈
 */
async function loadFullTree(nodes: TreeNode[]) {
  loadingStatus.value = '开始加载文档树...';
  loadingProgress.value = 0;

  try {
    await loadNodesBatch(nodes, BATCH_CONCURRENCY_LIMIT);
  } catch (err) {
    handleError(err, { action: 'loadFullTree' });
    throw err;
  } finally {
    loadingProgress.value = 100;
    loadingStatus.value = '';
  }
}

/**
 * 批量并发加载节点，控制并发数量以避免 API 风暴
 * @param nodes 需要加载的节点数组
 * @param concurrencyLimit 并发限制数量，默认 5
 */
async function loadNodesBatch(nodes: TreeNode[], concurrencyLimit: number = 5): Promise<void> {
  const queue: TreeNode[] = [...nodes];
  const inProgress = new Set<TreeNode>();
  let processedCount = 0;
  const totalCount = nodes.length;

  return new Promise((resolve) => {
    const processNext = async () => {
      if (queue.length === 0 && inProgress.size === 0) {
        resolve();
        return;
      }

      while (inProgress.size < concurrencyLimit && queue.length > 0) {
        const node = queue.shift();
        if (!node) continue;
        inProgress.add(node);

        loadChildrenWithRetry(node)
          .finally(() => {
            inProgress.delete(node);
            processedCount++;
            // 更新进度
            loadingProgress.value = Math.round((processedCount / totalCount) * 100);
            loadingStatus.value = `正在加载文档树... (${processedCount}/${totalCount})`;
          })
          .then(() => {
            // 批量将子节点加入队列（优化点）
            const childrenToAdd = node.children.filter(
              (child) => child.hasChildren && !child.childrenLoaded
            );
            if (childrenToAdd.length > 0) {
              // 在队列头部插入，优先处理深层节点
              queue.unshift(...childrenToAdd);
            }
            processNext();
          })
          .catch((err) => {
            handleError(err, { action: 'loadNodesBatch' }, false);
            processNext();
          });
      }
    };

    processNext();
  });
}

async function loadNotebooks() {
  const notebooks = await apiService.lsNotebooks();
  const tree: TreeNode[] = [];
  for (const notebook of notebooks.notebooks) {
    tree.push({
      checked: false,
      children: [],
      childrenLoaded: false,
      expanded: false,
      hasChildren: true,
      id: notebook.id,
      indeterminate: false,
      name: notebook.name,
      path: '/',
      type: 'notebook',
    });
  }
  return tree;
}
/**
 * 刷新已勾选节点的子节点（用于更新配置前确保数据完整）
 */
async function refreshCheckedNodes() {
  const nodesToRefresh: TreeNode[] = [];
  const collectChecked = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.checked) {
        nodesToRefresh.push(node);
      }
      collectChecked(node.children);
    }
  };
  collectChecked(treeData.value);

  for (const node of nodesToRefresh) {
    await loadChildren(node);
  }
}
/**
 * 重新初始化树的勾选状态，确保所有节点的半选状态正确
 * 流程：
 * 1. 加载完整的树结构（确保所有父子关系完整）
 * 2. 应用保存的勾选配置
 * 3. 如果父节点被勾选，强制子节点跟随勾选
 * 4. 自底向上计算半选状态
 */
async function reinitializeTreeState() {
  const tree = await loadNotebooks();
  const config = props.configManager.getConfig();

  // 1. 加载完整的树结构（确保所有父子关系完整）
  await loadFullTree(tree);

  // 2. 应用保存的勾选配置
  initCheckedState(tree, config.filteredNotebooks || [], config.filteredBlocks || []);

  // 3. 关键修复：如果文档块在配置中，强制其所有子节点为勾选状态
  const enforceBlockChecked = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'doc' && config.filteredBlocks?.includes(node.id)) {
        // 如果当前节点在配置中，强制所有子节点勾选
        setChildrenChecked(node, true);
      }
      enforceBlockChecked(node.children);
    }
  };
  enforceBlockChecked(tree);

  // 4. 自底向上计算半选状态
  updateIndeterminateState(tree);

  return tree;
}
async function updateConfig() {
  await refreshCheckedNodes();
  const filteredNotebooks: string[] = [];
  const filteredBlocks: string[] = [];

  // 收集所有选中的节点，但需要智能处理父子关系
  const collectSelectedSmart = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'notebook') {
        // 笔记本：只有当它被直接勾选（不是半选）时才保存
        if (node.checked && !node.indeterminate) {
          filteredNotebooks.push(node.id);
        }
      } else {
        // 文档块：只有当父节点没有被勾选时才保存
        // 这样可以避免重复保存（父节点勾选会自动包含所有子节点）
        const parentChecked = isParentChecked(node);
        if (node.checked && !parentChecked) {
          filteredBlocks.push(node.id);
        }
      }
      collectSelectedSmart(node.children);
    }
  };

  collectSelectedSmart(treeData.value);

  props.configManager.updateConfig('filteredNotebooks', filteredNotebooks);
  props.configManager.updateConfig('filteredBlocks', filteredBlocks);
}

onMounted(async () => {
  try {
    const tree = await reinitializeTreeState();
    treeData.value = [...tree];
  } catch (err: unknown) {
    // 类型安全的错误处理
    error.value = err instanceof Error ? err.message : props.i18n.unknownError;
    handleError(err, { context: 'InitializeTree' }, false);
  } finally {
    loading.value = false;
    loadingProgress.value = 0;
    loadingStatus.value = '';
  }
});
</script>

<script lang="ts">
import TreeItem from '@/components/TreeItem.vue';
export default {
  components: { TreeItem },
};
</script>

<template>
  <div class="doc-tree-selector">
    <div class="tree-toolbar">
      <button class="tree-toolbar-btn b3-button b3-button--outline" @click="expandAll">
        {{ i18n.expandAll }}
      </button>
      <button class="tree-toolbar-btn b3-button b3-button--outline" @click="collapseAll">
        {{ i18n.collapseAll }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      {{ i18n.loading }}
      <div v-if="loadingStatus" class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <span class="progress-text">{{ loadingStatus }}</span>
      </div>
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <TreeItem
        v-for="node in treeData"
        :key="node.id"
        :node="node"
        :level="0"
        :expanded="node.expanded"
        @update="handleNodeUpdate"
        @toggle-expand="handleToggleExpand"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.doc-tree-selector {
  max-height: 500px;
  overflow-y: auto;
  background: var(--b3-theme-background);
  border-radius: var(--b3-border-radius);
  padding: 0 0 4px 0;
  border: 1px solid var(--b3-border-color);

  .tree-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--b3-border-color);
    background: var(--b3-theme-background);
    position: sticky;
    top: 0;
    z-index: 1;

    .tree-toolbar-btn {
      padding: 4px 12px;
      font-size: 12px;
      cursor: pointer;
      background: var(--b3-theme-surface);
      border: 1px solid var(--b3-border-color);
      border-radius: 4px;
      color: var(--b3-theme-on-surface);
      transition: all 0.2s;

      &:hover {
        background: var(--b3-theme-primary-light);
        color: var(--b3-theme-on-primary-light);
        border-color: var(--b3-theme-primary);
      }
    }
  }

  .loading,
  .error {
    text-align: center;
    padding: 32px;
    color: var(--b3-theme-on-surface);
  }
  .loading-progress {
    margin-top: 16px;

    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--b3-theme-surface);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 8px;

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--b3-theme-primary), var(--b3-theme-primary-light));
        transition: width 0.3s ease;
      }
    }

    .progress-text {
      font-size: 12px;
      color: var(--b3-theme-on-surface);
    }
  }
  .error {
    color: var(--b3-theme-danger);
  }
}
</style>
