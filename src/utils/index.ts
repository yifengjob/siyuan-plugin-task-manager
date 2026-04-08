import { createApp, type Component } from 'vue';

export function getDomByVueComponent(component: Component) {
  const div = document.createElement('div');
  const app = createApp(component);
  app.mount(div);
  return div;
}
export * from './DateTimeUtils';
export * from './DomUtils';
export * from './FrontendDetector';
export * from './IconRegistry.ts';
export * from './MessageUtils';
export * from './PluginConfigManager.ts';
export * from './PluginInstance.ts';
export * from './SettingsFactory';
export * from './TreeUtils.ts';
export * from './ErrorHandler';
export * from './TaskMarkdownUtils';
