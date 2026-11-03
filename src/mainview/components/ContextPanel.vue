<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import type {SystemInfo, Todo} from '../../shared/rpc'
import {api} from '../rpc'

defineProps<{
  clock: string
  messageCount: number
}>()

const info = ref<SystemInfo | null>(null)
const todos = ref<Todo[]>([])
const newTitle = ref('')
const error = ref('')

async function refresh() {
  todos.value = await api.listTodos()
}

async function add() {
  error.value = ''
  try {
    await api.addTodo({title: newTitle.value})
    newTitle.value = ''
    await refresh()
  } catch (e) {
    error.value = String(e)
  }
}

async function toggle(id: number) {
  await api.toggleTodo({id})
  await refresh()
}

async function remove(id: number) {
  await api.deleteTodo({id})
  await refresh()
}

onMounted(async () => {
  info.value = await api.getSystemInfo()
  await refresh()
})
</script>

<template>
  <aside class="flex w-72 shrink-0 flex-col bg-sidebar">
    <div class="electrobun-webkit-app-region-drag flex h-12 shrink-0 items-center px-5 text-sm font-medium">Context</div>

    <div class="flex-1 space-y-6 overflow-y-auto px-5 pb-5 text-sm">
      <section>
        <h2 class="mb-2 text-xs text-muted">Tasks · state lives in Bun</h2>
        <input
          v-model="newTitle"
          class="selectable w-full rounded-lg bg-surface px-3 py-1.5 outline-none placeholder:text-muted"
          placeholder="Add a task and press Enter"
          @keyup.enter="add"
        />
        <p v-if="error" class="mt-1 text-xs text-accent">{{ error }}</p>
        <ul class="mt-2 space-y-0.5">
          <li v-for="t in todos" :key="t.id" class="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover">
            <input :checked="t.done" class="accent-[var(--accent)]" type="checkbox" @change="toggle(t.id)"/>
            <span :class="{'text-muted line-through': t.done}" class="flex-1 truncate">{{ t.title }}</span>
            <button class="hidden text-muted hover:text-text group-hover:block" @click="remove(t.id)">✕</button>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-xs text-muted">This chat</h2>
        <div class="flex justify-between"><span class="text-muted">Messages</span><span>{{ messageCount }}</span></div>
      </section>

      <section>
        <h2 class="mb-2 text-xs text-muted">System · from Bun process</h2>
        <dl v-if="info" class="space-y-1">
          <div class="flex justify-between"><dt class="text-muted">Platform</dt><dd>{{ info.os }}/{{ info.arch }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">Runtime</dt><dd>{{ info.runtime }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">CPUs</dt><dd>{{ info.cpus }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted">Clock event</dt><dd class="font-mono">{{ clock }}</dd></div>
        </dl>
      </section>
    </div>
  </aside>
</template>
