// src/utils/TreeUtils.ts

export interface TreeNodeBase {
  checked: boolean;
  children: this[];
  childrenLoaded?: boolean;
  expanded: boolean;
  id: string;
  indeterminate: boolean;
  name: string;
  type: 'doc' | 'notebook';
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

// 在树中查找节点
export function findNode<T extends TreeNodeBase>(nodes: T[], id: string, type: string): null | T {
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
export function findPath<T extends TreeNodeBase>(nodes: T[], id: string, type: string): null | T[] {
  for (const node of nodes) {
    if (node.id === id && node.type === type) return [node];
    if (node.children.length) {
      const path = findPath(node.children, id, type);
      if (path) return [node, ...path];
    }
  }
  return null;
}

// 递归设置所有节点的展开状态
export function setAllExpanded<T extends TreeNodeBase>(nodes: T[], expanded: boolean): void {
  for (const node of nodes) {
    node.expanded = expanded;
    if (node.children.length) {
      setAllExpanded(node.children, expanded);
    }
  }
}

// 递归设置节点及其所有后代的 checked 状态
export function setChildrenChecked<T extends TreeNodeBase>(node: T, checked: boolean): void {
  node.checked = checked;
  node.indeterminate = false;
  for (const child of node.children) {
    setChildrenChecked(child, checked);
  }
}

// 自底向上更新所有节点的半选状态
export function updateIndeterminateState<T extends TreeNodeBase>(nodes: T[]): void {
  for (const node of nodes) {
    if (node.children.length) {
      updateIndeterminateState(node.children);
      const childCheckedCount = node.children.filter((c) => c.checked).length;
      const childIndeterminateCount = node.children.filter((c) => c.indeterminate).length;
      if (childCheckedCount === node.children.length) {
        node.checked = true;
        node.indeterminate = false;
      } else if (childCheckedCount === 0 && childIndeterminateCount === 0) {
        node.checked = false;
        node.indeterminate = false;
      } else {
        node.checked = false; // 关键修复：半选时必须设置 checked = false
        node.indeterminate = true;
      }
    }
  }
}
