/**
 * 任务 Markdown 内容处理工具
 * 提供任务复选框状态的转换功能
 *
 * @remarks
 * 思源笔记的任务使用标准 Markdown checkbox 语法:
 * - 未完成: `- [ ] 任务内容`
 * - 已完成: `- [X] 任务内容` 或 `- [x] 任务内容`
 */

/**
 * 从 Markdown 中提取任务文本内容
 * @param markdown - 任务的 Markdown 内容
 * @returns 纯文本内容（不包含 checkbox）
 *
 * @example
 * extractTaskText('- [ ] 完成任务') // '完成任务'
 * extractTaskText('- [X] 完成任务') // '完成任务'
 */
export function extractTaskText(markdown: string): string {
  if (!markdown) return '';
  // 移除开头的 "- [ ] " 或 "- [X] "
  return markdown.replace(/^-\s*\[[ Xx]]\s*/, '');
}

/**
 * 检查任务是否已完成
 * @param markdown - 任务的 Markdown 内容
 * @returns 是否为已完成状态
 */
export function isTaskCompleted(markdown: null | string | undefined): boolean {
  if (!markdown) return false;
  return markdown.startsWith('- [X]');
}

/**
 * 切换任务复选框状态
 * @param markdown - 任务的 Markdown 内容
 * @param completed - 目标完成状态
 * @returns 更新后的 Markdown 内容
 *
 * @example
 * toggleTaskCheckbox('- [ ] 任务内容', true)  // '- [X] 任务内容'
 * toggleTaskCheckbox('- [X] 任务内容', false) // '- [ ] 任务内容'
 */
export function toggleTaskCheckbox(markdown: string, completed: boolean): string {
  if (!markdown) return markdown;

  if (completed) {
    // 未完成 -> 已完成：- [ ] -> - [X]
    return markdown.replace(/^-\s*\[\s*]/, '- [X]');
  } else {
    // 已完成 -> 未完成：- [X] -> - [ ]
    return markdown.replace(/^-\s*\[X]/i, '- [ ]');
  }
}
