<script setup lang="ts">
import { Custom, MobileCustom } from 'siyuan';
import { App, createApp, onMounted, onUnmounted, ref } from 'vue';

import Sidebar from '@/components/Sidebar.vue';
import TaskPopover from '@/components/TaskPopover.vue';
import { SIDEBAR_DEFAULT_WIDTH } from '@/constants';
import { useTaskStore } from '@/stores/tasks.store';
import { PopoverOptions, TaskAttrs } from '@/types';
import { IconRegistry, usePlugin } from '@/utils';

const plugin = usePlugin();
let dockApp: App<Element> | null = null;
const taskStore = useTaskStore();
const popoverOptions = ref<null | PopoverOptions>(null);

const handlePopoverSave = async (attrs: Partial<TaskAttrs>) => {
  if (popoverOptions.value?.taskId) {
    await taskStore.updateTaskAttributes(popoverOptions.value.taskId, attrs);
    if (
      attrs.completed !== undefined &&
      popoverOptions.value.attrs?.completed !== attrs.completed
    ) {
      await taskStore.toggleTaskStatus(popoverOptions.value.taskId, attrs.completed);
    }
    popoverOptions.value = null;
  }
};

const handlePopoverClose = () => {
  popoverOptions.value = null;
};

onMounted(() => {
  const iconRegister = new IconRegistry(plugin);
  iconRegister.registerIcons();

  plugin.addDock({
    config: {
      icon: 'iconTaskBoard',
      position: 'RightTop',
      size: {
        height: 0,
        width: SIDEBAR_DEFAULT_WIDTH,
      },
      title: plugin.i18n.sidebarTitle,
    },
    data: {},
    destroy: () => {
      dockApp?.unmount();
      dockApp = null;
    },
    init: async (dock: Custom | MobileCustom) => {
      const container = dock.element;
      container.classList.add('task-sidebar');
      container.id = `${plugin.name || 'plugin'}-dock-container`;
      container.innerHTML = '';
      dockApp = createApp(Sidebar);
      dockApp.mount(container);
    },
    type: 'task-manager-dock',
  });
});

onUnmounted(() => {
  dockApp?.unmount();
  dockApp = null;
});

// 暴露方法给外部调用
defineExpose({
  hidePopover: () => {
    popoverOptions.value = null;
  },
  showPopover: (options: PopoverOptions) => {
    popoverOptions.value = options;
  },
});
</script>

<template>
  <div class="task-manager-app">
    <TaskPopover :options="popoverOptions" @save="handlePopoverSave" @close="handlePopoverClose" />
  </div>
</template>

<style lang="scss" scoped>
.task-manager-app {
  position: relative;
}
</style>
