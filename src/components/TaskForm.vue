<script setup lang="ts">
import type { TaskAttrs } from '@/types';
import { computed, reactive } from 'vue';
import { usePlugin } from '@/utils/pluginInstance.ts';

const props = defineProps<{
    taskId: string;
    isEditable: boolean;
    initialAttrs: TaskAttrs;
    createdDate: string | null;
}>();

const emit = defineEmits<{
    (e: 'save', attrs: any): void;
    (e: 'cancel'): void;
}>();

const i18n = usePlugin().i18n;

const form = reactive({
    start: props.initialAttrs.start,
    planDue: props.initialAttrs.planDue,
    actualDue: props.initialAttrs.actualDue,
    priority: props.initialAttrs.priority,
    notes: props.initialAttrs.notes,
});

const createdStr = computed(() => {
    if (!props.createdDate) return '—';
    const created = props.createdDate;
    const year = created.substring(0, 4);
    const month = created.substring(4, 6);
    const day = created.substring(6, 8);
    const hour = created.substring(8, 10);
    const minute = created.substring(10, 12);
    return `${year}-${month}-${day} ${hour}:${minute}`;
});

const save = () => {
    emit('save', {
        start: form.start,
        planDue: form.planDue,
        actualDue: form.actualDue,
        priority: form.priority,
        notes: form.notes,
    });
};

const cancel = () => {
    emit('cancel');
};
</script>

<template>
    <div class="task-full-form">
        <div class="task-tooltip-row">
            <span class="tooltip-field">
                <svg class="icon"><use xlink:href="#iconStart"></use></svg>
                <input
                    v-model="form.start"
                    type="date"
                    :readonly="!isEditable"
                />
            </span>
            <span class="tooltip-field">
                <svg class="icon"><use xlink:href="#iconPlanDue"></use></svg>
                <input
                    v-model="form.planDue"
                    type="date"
                    :readonly="!isEditable"
                />
            </span>
        </div>
        <div class="task-tooltip-row">
            <span class="tooltip-field">
                <svg class="icon"><use xlink:href="#iconActualDue"></use></svg>
                <input
                    v-model="form.actualDue"
                    type="date"
                    :readonly="!isEditable"
                />
            </span>
            <span class="tooltip-field">
                <svg class="icon"><use xlink:href="#iconPriority"></use></svg>
                <select v-model="form.priority" :disabled="!isEditable">
                    <option value="high">{{ i18n.priorityHigh }}</option>
                    <option value="medium">{{ i18n.priorityMedium }}</option>
                    <option value="normal">{{ i18n.priorityNormal }}</option>
                    <option value="low">{{ i18n.priorityLow }}</option>
                </select>
            </span>
        </div>
        <div class="task-tooltip-row">
            <span class="tooltip-field tooltip-field--notes">
                <svg class="icon"><use xlink:href="#iconNotes"></use></svg>
                <textarea
                    v-model="form.notes"
                    :readonly="!isEditable"
                    rows="3"
                ></textarea>
            </span>
        </div>
        <div class="task-tooltip-created">
            <div>
                <svg class="icon">
                    <use xlink:href="#iconCreated"></use>
                </svg>
                {{ createdStr }}
            </div>
            <div class="task-tooltip-buttons">
                <button v-if="isEditable" class="task-save-btn" @click="save">
                    {{ i18n.save }}
                </button>
                <button class="task-cancel-btn" @click="cancel">
                    {{ i18n.cancel }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
