<script setup lang="ts">
import { App, createApp, onMounted, onUnmounted, ref } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import TaskPopover from '@/components/TaskPopover.vue';
import { useTaskStore } from '@/stores/tasks.store.ts';
import { usePlugin, IconRegistry } from '@/utils';
import { PopoverOptions, TaskAttrs } from '@/types';
import { SIDEBAR_DEFAULT_WIDTH } from '@/constants';

const plugin = usePlugin();
let dockApp: App<Element> | null = null;
const taskStore = useTaskStore();
const popoverOptions = ref<PopoverOptions | null>(null);

const handlePopoverSave = async (attrs: Partial<TaskAttrs>) => {
  if (popoverOptions.value?.taskId) {
    await taskStore.updateTaskAttributes(popoverOptions.value.taskId, attrs);
    if (
      attrs.completed !== undefined &&
      popoverOptions.value.attrs?.completed !== attrs.completed
    ) {
      await taskStore.toggleTaskStatus(
        popoverOptions.value.taskId,
        attrs.completed
      );
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
      position: 'RightTop',
      size: {
        width: SIDEBAR_DEFAULT_WIDTH,
        height: 0,
      },
      icon: 'iconTaskBoard',
      title: plugin.i18n.sidebarTitle,
    },
    data: {},
    type: 'task-manager-dock',
    init: async (dock: any) => {
      const container = dock.element;
      container.classList.add('task-sidebar');
      container.id = `${plugin.name || 'plugin'}-dock-container`;
      container.innerHTML = '';
      dockApp = createApp(Sidebar);
      dockApp.mount(container);
    },
    destroy: () => {
      dockApp?.unmount();
      dockApp = null;
    },
  });
});

onUnmounted(() => {
  dockApp?.unmount();
  dockApp = null;
});

// 暴露方法给外部调用
defineExpose({
  showPopover: (options: PopoverOptions) => {
    popoverOptions.value = options;
  },
  hidePopover: () => {
    popoverOptions.value = null;
  },
});
</script>

<template>
  <div class="task-manager-app">
    <TaskPopover
      :options="popoverOptions"
      @save="handlePopoverSave"
      @close="handlePopoverClose"
    />
  </div>
</template>

<style lang="scss" scoped>
.task-manager-app {
  position: relative;
}
</style>
