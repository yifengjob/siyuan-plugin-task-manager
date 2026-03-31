// src/utils/treeUtils.ts

/**
 * 树节点基础接口
 */
export interface TreeNodeBase {
    id: string;
    name: string;
    type: 'notebook' | 'doc';
    children: this[];
    checked: boolean;
    indeterminate: boolean;
    expanded: boolean;
    childrenLoaded?: boolean; // 标记子节点是否已加载（懒加载）
}

/**
 * 在树中查找节点
 */
export function findNode<T extends TreeNodeBase>(
    nodes: T[],
    id: string,
    type: string
): T | null {
    for (const node of nodes) {
        if (node.id === id && node.type === type) return node;
        if (node.children.length) {
            const found = findNode(node.children, id, type);
            if (found) return found;
        }
    }
    return null;
}

/**
 * 更新树中的节点（替换匹配的节点）
 */
export function updateNodeInTree<T extends TreeNodeBase>(
    nodes: T[],
    target: T
): boolean {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === target.id && nodes[i].type === target.type) {
            nodes[i] = target;
            return true;
        }
        if (nodes[i].children.length) {
            const found = updateNodeInTree(nodes[i].children, target);
            if (found) return true;
        }
    }
    return false;
}

/**
 * 递归设置节点及其子节点的 checked 状态
 */
export function setChildrenChecked<T extends TreeNodeBase>(
    node: T,
    checked: boolean
): void {
    node.checked = checked;
    node.indeterminate = false;
    for (const child of node.children) {
        setChildrenChecked(child, checked);
    }
}

/**
 * 收集所有被选中的笔记本和文档 ID
 */
export function collectSelected<T extends TreeNodeBase>(
    nodes: T[],
    notebooks: string[],
    blocks: string[]
): void {
    for (const node of nodes) {
        if (node.checked) {
            if (node.type === 'notebook') {
                notebooks.push(node.id);
            } else {
                blocks.push(node.id);
            }
        }
        collectSelected(node.children, notebooks, blocks);
    }
}

/**
 * 更新节点的半选状态（自底向上）
 */
export function updateIndeterminateState<T extends TreeNodeBase>(
    nodes: T[]
): void {
    for (const node of nodes) {
        if (node.children.length) {
            updateIndeterminateState(node.children);
            const childCheckedCount = node.children.filter(
                (c) => c.checked
            ).length;
            if (childCheckedCount === node.children.length) {
                node.checked = true;
                node.indeterminate = false;
            } else if (childCheckedCount === 0) {
                node.checked = false;
                node.indeterminate = false;
            } else {
                node.indeterminate = true;
            }
        }
    }
}

/**
 * 递归设置所有节点的展开状态
 */
export function setAllExpanded<T extends TreeNodeBase>(
    nodes: T[],
    expanded: boolean
): void {
    for (const node of nodes) {
        node.expanded = expanded;
        if (node.children.length) {
            setAllExpanded(node.children, expanded);
        }
    }
}
