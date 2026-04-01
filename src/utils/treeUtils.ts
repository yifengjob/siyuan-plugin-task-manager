// src/utils/treeUtils.ts

export interface TreeNodeBase {
    id: string;
    name: string;
    type: 'notebook' | 'doc';
    children: this[];
    checked: boolean;
    indeterminate: boolean;
    expanded: boolean;
    childrenLoaded?: boolean;
}

// 在树中查找节点
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

// 查找从根到目标节点的路径
export function findPath<T extends TreeNodeBase>(
    nodes: T[],
    id: string,
    type: string
): T[] | null {
    for (const node of nodes) {
        if (node.id === id && node.type === type) return [node];
        if (node.children.length) {
            const path = findPath(node.children, id, type);
            if (path) return [node, ...path];
        }
    }
    return null;
}

// 递归设置节点及其所有后代的 checked 状态
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

// 收集所有选中的笔记本和文档 ID
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

// 自底向上更新所有节点的半选状态
export function updateIndeterminateState<T extends TreeNodeBase>(
    nodes: T[]
): void {
    for (const node of nodes) {
        if (node.children.length) {
            updateIndeterminateState(node.children);
            const childCheckedCount = node.children.filter(
                (c) => c.checked
            ).length;
            const childIndeterminateCount = node.children.filter(
                (c) => c.indeterminate
            ).length;
            if (childCheckedCount === node.children.length) {
                node.checked = true;
                node.indeterminate = false;
            } else if (
                childCheckedCount === 0 &&
                childIndeterminateCount === 0
            ) {
                node.checked = false;
                node.indeterminate = false;
            } else {
                node.indeterminate = true;
            }
        }
    }
}

// 递归设置所有节点的展开状态
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

// 更新从根到目标节点的所有祖先状态（自底向上）
export function updateAncestorsState<T extends TreeNodeBase>(
    nodes: T[],
    targetId: string,
    targetType: string
): boolean {
    const path = findPath(nodes, targetId, targetType);
    if (!path) return false;

    // 从目标节点开始向上更新
    for (let i = path.length - 1; i >= 0; i--) {
        const node = path[i];
        if (node.children.length) {
            let anyIndeterminate = false;
            let allChecked = true;
            let anyChecked = false;
            for (const child of node.children) {
                if (child.indeterminate) anyIndeterminate = true;
                if (!child.checked) allChecked = false;
                if (child.checked) anyChecked = true;
            }
            if (allChecked) {
                node.checked = true;
                node.indeterminate = false;
            } else if (!anyChecked && !anyIndeterminate) {
                node.checked = false;
                node.indeterminate = false;
            } else {
                node.indeterminate = true;
            }
        }
    }
    return true;
}
