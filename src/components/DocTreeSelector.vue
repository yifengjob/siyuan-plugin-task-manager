<template>
    <div class="doc-tree-selector">
        <div class="tree-toolbar">
            <button
                class="tree-toolbar-btn b3-button b3-button--outline"
                @click="expandAll"
            >
                {{ i18n.expandAll || '全部展开' }}
            </button>
            <button
                class="tree-toolbar-btn b3-button b3-button--outline"
                @click="collapseAll"
            >
                {{ i18n.collapseAll || '全部折叠' }}
            </button>
        </div>

        <div v-if="loading" class="loading">{{ i18n.loading }}</div>
        <div v-else-if="error" class="error">{{ error }}</div>
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

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiService } from '@/services/ApiService';
import type { PluginConfigManager } from '@/utils/PluginConfigManager';
import type { I18n } from '@/types';
import {
    findNode,
    setChildrenChecked,
    collectSelected,
    updateIndeterminateState,
    setAllExpanded,
    type TreeNodeBase,
} from '@/utils/treeUtils';

const props = defineProps<{
    configManager: PluginConfigManager;
    i18n: I18n;
}>();

const loading = ref(true);
const error = ref<string | null>(null);
const treeData = ref<TreeNode[]>([]);

interface TreeNode extends TreeNodeBase {
    icon?: string;
    childrenLoaded: boolean;
    hasChildren: boolean;
    box?: string;
    path: string;
}

async function loadNotebooks() {
    const notebooks = await apiService.lsNotebooks();
    const tree: TreeNode[] = [];
    for (const notebook of notebooks.notebooks) {
        tree.push({
            id: notebook.id,
            name: notebook.name,
            type: 'notebook',
            children: [],
            checked: false,
            indeterminate: false,
            expanded: false,
            childrenLoaded: false,
            hasChildren: true,
            path: '/',
        });
    }
    return tree;
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
                console.warn(`Document node ${node.id} missing box property`);
                node.childrenLoaded = true;
                node.hasChildren = false;
                return;
            }
            notebookId = node.box;
            path = node.path;
        }

        const result = await apiService.listDocsByPath(notebookId, path);

        if (!result || !result.files) {
            console.warn(
                `listDocsByPath returned null for ${node.id} (${notebookId}, ${path})`
            );
            node.childrenLoaded = true;
            node.hasChildren = false;
            return;
        }

        const children = result.files.map((file) => ({
            id: file.id,
            name: file.name.replace(/\.sy$/, ''),
            type: 'doc' as const,
            children: [],
            checked: node.checked, // 继承父节点状态
            indeterminate: false,
            expanded: false,
            childrenLoaded: false,
            hasChildren: file.subFileCount > 0,
            icon: file.icon || '',
            box: notebookId,
            path: file.path,
        }));

        node.children = children;
        node.childrenLoaded = true;
        if (children.length === 0) {
            node.hasChildren = false;
        }

        // 如果父节点是选中状态，递归设置子节点选中（已通过继承实现，但再次确保）
        if (node.checked) {
            setChildrenChecked(node, true);
        }
    } catch (err) {
        console.error(`Failed to load children for ${node.id}:`, err);
        node.childrenLoaded = true;
        node.hasChildren = false;
    }
}

async function expandAllChildren(node: TreeNode) {
    // 如果节点尚未加载子节点，先加载
    if (!node.childrenLoaded && node.hasChildren) {
        await loadChildren(node);
    }
    // 展开当前节点
    node.expanded = true;
    // 递归处理所有子节点
    for (const child of node.children) {
        await expandAllChildren(child);
    }
}

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

async function expandAll() {
    await loadAllChildren(treeData.value);
    setAllExpanded(treeData.value, true);
    treeData.value = [...treeData.value];
}

function collapseAll() {
    setAllExpanded(treeData.value, false);
    treeData.value = [...treeData.value];
}

// 修改 handleNodeUpdate 为异步
async function handleNodeUpdate(updatedNode: TreeNode) {
    const target = findNode(treeData.value, updatedNode.id, updatedNode.type);
    if (target) {
        target.checked = updatedNode.checked;
        target.indeterminate = false;

        if (updatedNode.checked) {
            await expandAllChildren(target);
            setChildrenChecked(target, true);
        } else {
            setChildrenChecked(target, false);
        }

        updateIndeterminateState(treeData.value);
        await updateConfig(); // 等待异步保存
        treeData.value = [...treeData.value];
    }
}
// 新增：递归加载勾选节点的所有后代
async function ensureDescendantsLoaded(nodes: TreeNode[]) {
    for (const node of nodes) {
        if (node.checked && node.hasChildren && !node.childrenLoaded) {
            await loadChildren(node);
            if (node.children.length) {
                await ensureDescendantsLoaded(node.children);
            }
        } else if (node.children.length) {
            await ensureDescendantsLoaded(node.children);
        }
    }
}
// 修改 updateConfig 为异步函数
async function updateConfig() {
    // 确保所有勾选节点的后代都被加载
    await ensureDescendantsLoaded(treeData.value);

    const filteredNotebooks: string[] = [];
    const filteredBlocks: string[] = [];
    collectSelected(treeData.value, filteredNotebooks, filteredBlocks);
    props.configManager.updateConfig('filteredNotebooks', filteredNotebooks);
    props.configManager.updateConfig('filteredBlocks', filteredBlocks);
}

function initCheckedState(
    nodes: TreeNode[],
    filteredNotebooks: string[],
    filteredBlocks: string[]
) {
    for (const node of nodes) {
        if (node.type === 'notebook') {
            node.checked = filteredNotebooks.includes(node.id);
        } else {
            node.checked = filteredBlocks.includes(node.id);
        }
        initCheckedState(node.children, filteredNotebooks, filteredBlocks);
    }
    updateIndeterminateState(nodes);
}

onMounted(async () => {
    try {
        const tree = await loadNotebooks();
        const config = props.configManager.getConfig();
        initCheckedState(
            tree,
            config.filteredNotebooks || [],
            config.filteredBlocks || []
        );
        treeData.value = tree;
    } catch (err: any) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
});
</script>

<script lang="ts">
import TreeItem from '@/components/TreeItem.vue';

export default {
    components: { TreeItem },
};
</script>

<style scoped lang="scss">
/* 样式保持不变 */
</style>
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
    .error {
        color: var(--b3-theme-danger);
    }
}
</style>
