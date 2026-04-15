import { type Component, createApp } from 'vue';

export function getDomByVueComponent(component: Component) {
  const div = document.createElement('div');
  const app = createApp(component);
  app.mount(div);
  return div;
}
export * from './DateTimeUtils';
export * from './DomUtils';
export * from './ErrorHandler';
export * from './FrontendDetector';
export * from './IconRegistry';
export * from './MessageUtils';
export * from './PluginConfigManager';
export * from './PluginInstance';
export * from './SettingsFactory';
export * from './SqlUtils';
export * from './TaskMarkdownUtils';
export * from './TreeUtils';
