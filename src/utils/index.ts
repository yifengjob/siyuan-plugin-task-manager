import { createApp } from 'vue';

export function getDomByVueComponent(component) {
    const div = document.createElement('div');
    const app = createApp(component);
    app.mount(div);
    return div;
}

export function escapeSql(value: string): string {
    return value.replace(/'/g, "''");
}
