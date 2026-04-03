import TaskManagerPlugin from '@/index.ts';
import iconTaskActualDue from '@/assets/icons/task-actual-due.svg?raw';
import iconTaskBoard from '@/assets/icons/task-board.svg?raw';
import iconTaskCreated from '@/assets/icons/task-created.svg?raw';
import iconTaskNotes from '@/assets/icons/task-notes.svg?raw';
import iconTaskPlanDue from '@/assets/icons/task-plan-due.svg?raw';
import iconTaskPriority from '@/assets/icons/task-priority.svg?raw';
import iconTaskPriorityHigh from '@/assets/icons/task-priority-high.svg?raw';
import iconTaskPriorityLow from '@/assets/icons/task-priority-low.svg?raw';
import iconTaskPriorityMedium from '@/assets/icons/task-priority-medium.svg?raw';
import iconTaskPriorityNormal from '@/assets/icons/task-priority-normal.svg?raw';
import iconTaskStart from '@/assets/icons/task-start.svg?raw';
import iconTaskStatusDue from '@/assets/icons/task-status-due.svg?raw';
import iconTaskStatusUnDue from '@/assets/icons/task-status-un-due.svg?raw';
import iconNotebook from '@/assets/icons/notebook.svg?raw';
import iconDocument from '@/assets/icons/document.svg?raw';
import iconEmpty from '@/assets/icons/clipboard.svg?raw';
import iconError from '@/assets/icons/error.svg?raw';

interface IconDefinition {
  content: string;
  symbolId: string;
}

const ICONS: IconDefinition[] = [
  { content: iconTaskBoard, symbolId: 'iconTaskBoard' },
  { content: iconTaskCreated, symbolId: 'iconTaskCreated' },
  { content: iconTaskStart, symbolId: 'iconTaskStart' },
  { content: iconTaskPlanDue, symbolId: 'iconTaskPlanDue' },
  { content: iconTaskActualDue, symbolId: 'iconTaskActualDue' },
  { content: iconTaskPriority, symbolId: 'iconTaskPriority' },
  { content: iconTaskNotes, symbolId: 'iconTaskNotes' },
  { content: iconTaskStatusDue, symbolId: 'iconTaskStatusDue' },
  { content: iconTaskStatusUnDue, symbolId: 'iconTaskStatusUnDue' },
  { content: iconTaskPriorityHigh, symbolId: 'iconTaskPriorityHigh' },
  { content: iconTaskPriorityMedium, symbolId: 'iconTaskPriorityMedium' },
  { content: iconTaskPriorityNormal, symbolId: 'iconTaskPriorityNormal' },
  { content: iconTaskPriorityLow, symbolId: 'iconTaskPriorityLow' },
  { content: iconNotebook, symbolId: 'iconNotebook' },
  { content: iconDocument, symbolId: 'iconDocument' },
  { content: iconEmpty, symbolId: 'iconEmpty' },
  { content: iconError, symbolId: 'iconError' },
];
export class IconRegistry {
  constructor(private plugin: TaskManagerPlugin) {}
  /**
   * 注册所有图标
   */
  registerIcons() {
    ICONS.forEach((icon) => {
      // 确保 SVG 有正确的 id
      const svgWithId = this.ensureSvgId(icon.content, icon.symbolId);
      this.plugin.addIcons(svgWithId);
    });
  }
  /**
   * 确保 SVG 元素有正确的 id
   */
  private ensureSvgId(svgContent: string, symbolId: string): string {
    // 使用更灵活的正则表达式，匹配 <svg> 标签内的任意位置的 id
    const svgTagMatch = svgContent.match(/<svg\s+([^>]*)>/);

    if (!svgTagMatch) {
      return svgContent;
    }

    const svgAttributes = svgTagMatch[1];
    const hasId = /(\s|^)id=["'][^"']*["']/.test(svgAttributes);

    if (hasId) {
      // 替换现有 id（无论 id 在什么位置）
      return svgContent.replace(
        /(\s|^)id=["'][^"']*["']/,
        (_match: string, prefix: string) => `${prefix}id="${symbolId}"`
      );
    } else {
      // 在 <svg> 标签中添加 id（放在最后，> 之前）
      return svgContent.replace(
        /<svg\s+([^>]*)>/,
        (_match: string, attrs: string) => `<svg ${attrs} id="${symbolId}">`
      );
    }
  }
}
