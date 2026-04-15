import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { onUnmounted } from 'vue';

/**
 * Tooltip 功能 Composable
 * 管理悬浮提示的显示和定位
 */
export function useTooltip() {
  let tooltipElement: HTMLDivElement | null = null;
  let cleanupAutoUpdate: (() => void) | null = null;

  /**
   * 创建 Tooltip
   */
  const createTooltip = (reference: HTMLElement, content: string) => {
    destroyTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'task-sidebar-tooltip';
    tooltip.textContent = content;
    document.body.appendChild(tooltip);

    const arrow = document.createElement('div');
    arrow.className = 'task-sidebar-tooltip-arrow';
    tooltip.appendChild(arrow);

    tooltipElement = tooltip;

    cleanupAutoUpdate = autoUpdate(
      reference,
      tooltip,
      () => {
        computePosition(reference, tooltip, {
          middleware: [
            offset(8),
            flip(),
            shift({ padding: 8 }),
            arrowMiddleware({ element: arrow, padding: 4 }),
          ],
          placement: 'left',
        }).then(({ middlewareData, placement, x, y }) => {
          Object.assign(tooltip.style, {
            left: `${x}px`,
            top: `${y}px`,
          });

          if (middlewareData.arrow) {
            const { x: arrowX, y: arrowY } = middlewareData.arrow;
            const staticSide = {
              bottom: 'top',
              left: 'right',
              right: 'left',
              top: 'bottom',
            }[placement.split('-')[0]];
            Object.assign(arrow.style, {
              bottom: '',
              left: arrowX !== null ? `${arrowX}px` : '',
              right: '',
              [staticSide ?? '']: '-4px',
              top: arrowY !== null ? `${arrowY}px` : '',
            });
          }
        });
      },
      { animationFrame: true }
    );
  };

  /**
   * 销毁 Tooltip
   */
  const destroyTooltip = () => {
    if (cleanupAutoUpdate) {
      cleanupAutoUpdate();
      cleanupAutoUpdate = null;
    }
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
  };

  /**
   * 鼠标进入事件处理
   */
  const onMouseEnter = (event: MouseEvent, content: string) => {
    const target = event.currentTarget as HTMLElement;
    createTooltip(target, content);
  };

  /**
   * 鼠标离开事件处理
   */
  const onMouseLeave = () => {
    destroyTooltip();
  };

  // 清理
  onUnmounted(() => {
    destroyTooltip();
  });

  return {
    destroyTooltip,
    onMouseEnter,
    onMouseLeave,
  };
}
