// src/utils/DomUtils.ts

import { IProtyle, Lute } from 'siyuan';

import { AppError, ErrorLevel, handleError } from '@/utils/ErrorHandler';

/**
 * 从点击事件中提取目标元素
 */
export const isElementEditable = (element: HTMLElement): boolean => {
  let currentElement: HTMLElement | null = element;
  while (currentElement) {
    const editable = currentElement.contentEditable;
    if (editable === 'true') return true;
    if (editable === 'false') return false;
    currentElement = currentElement.parentElement;
  }
  return false;
};

/**
 * 从思源笔记的点击事件中提取目标元素
 * 按优先级尝试多种来源获取目标元素
 *
 * @param eventData - 思源笔记的点击事件对象
 * @returns 目标元素和原始鼠标事件
 */
export const getClickTargetFromEvent = (
  eventData: CustomEvent<{ event: MouseEvent; protyle: IProtyle }>
): {
  originalEvent: MouseEvent | null;
  targetElement: HTMLElement | null;
} => {
  const detail = eventData.detail;
  let targetElement: HTMLElement | null = null;
  let originalEvent: MouseEvent | null = null;

  // 尝试从 detail.event 获取
  if (detail?.event) {
    originalEvent = detail.event;
    const eventTarget = originalEvent.target as HTMLElement;
    targetElement = eventTarget?.closest('[data-node-id]') || eventTarget;
  }

  // 尝试从 currentTarget 获取（仅当 currentTarget 是 HTMLElement 时）
  if (!targetElement && eventData.currentTarget instanceof HTMLElement) {
    targetElement = eventData.currentTarget;
  }

  return {
    originalEvent,
    targetElement,
  };
};

/**
 * 从 DOM 节点提取 HTMLElement
 *
 * @param node - DOM 节点
 * @returns HTMLElement 或 null
 */
export const extractTargetElement = (node: Node): HTMLElement | null => {
  if (node instanceof HTMLElement) {
    return node;
  }
  if (node.parentNode instanceof HTMLElement) {
    return node.parentNode;
  }
  return null;
};

/**
 * 查找任务块元素
 * 查找包含 data-node-id 且 subtype 为 t 的元素
 *
 * @param targetElement - 目标元素
 * @returns 任务块元素或 null
 */
export const findTaskElement = (targetElement: HTMLElement): HTMLElement | null => {
  const taskElement = targetElement.closest(
    '[data-node-id][data-subtype="t"][data-type="NodeListItem"]'
  );
  if (taskElement) return taskElement as HTMLElement;
  return null;
};

export const findTaskElementFromBlockId = (blockId: string): HTMLElement | null => {
  const elements = document.querySelectorAll(`[data-node-id="${blockId}"]`);

  for (const element of elements) {
    const targetElement = extractTargetElement(element);
    if (!targetElement) continue;

    const taskElement = findTaskElement(targetElement);
    if (taskElement) return taskElement;
  }

  return null;
};

export const getBlockIdFromElement = (element: HTMLElement): null | string => {
  const blockId = element.getAttribute('data-node-id');
  if (blockId) return blockId;
  return null;
};

/**
 * 使用 Lute 渲染 Markdown 为 HTML
 *
 * @param markdown - Markdown 文本
 * @param stripTaskMarker - 是否去除任务标记（如：- [ ]、- [x] 等），默认为 false
 * @returns 渲染后的 HTML 字符串或 null
 */
export const renderMarkdownWithLute = (
  markdown: string,
  stripTaskMarker: boolean = false
): null | string => {
  if (!window.Lute) return null;
  try {
    let processedMarkdown = markdown;

    // 如果需要去除任务标记
    if (stripTaskMarker) {
      // 匹配并去除行首的任务标记：- [ ]、- [x]、- [X]、* [ ]、+ [ ] 等
      processedMarkdown = markdown.replace(/^\s*[-*+]\s+\[[ xX]]\s+/m, '');
    }

    const lute: Lute = window.Lute.New();
    if (lute && typeof lute.MarkdownStr === 'function') {
      return lute.MarkdownStr('', processedMarkdown);
    }
  } catch (e) {
    handleError(
      new AppError(`Lute 渲染失败:${e}`),
      {
        action: 'renderMarkdownWithLute',
        level: ErrorLevel.ERROR,
      },
      false
    );
  }
  return null;
};
