<script lang="ts" setup>
import type {Session} from '../../shared/rpc'

defineProps<{
  sessions: Session[]
  currentId: number | null
}>()

defineEmits<{
  select: [id: number]
  create: []
  remove: [id: number]
}>()
</script>

<template>
  <aside class="flex w-64 shrink-0 flex-col bg-sidebar">
    <!-- Title-bar strip; left padding leaves room for the traffic lights -->
    <div class="electrobun-webkit-app-region-drag flex h-12 shrink-0 items-center pl-20 pr-3"></div>

    <div class="px-3">
      <button
        class="electrobun-webkit-app-region-no-drag flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-hover"
        @click="$emit('create')"
      >
        <span class="flex size-5 items-center justify-center rounded-full bg-accent text-accent-fg">
          <svg class="size-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
          </svg>
        </span>
        New chat
      </button>
    </div>

    <div class="mt-4 px-6 pb-1 text-xs text-muted">Recents</div>
    <nav class="flex-1 overflow-y-auto px-3 pb-3">
      <div
        v-for="s in sessions"
        :key="s.id"
        :class="s.id === currentId ? 'bg-hover' : 'hover:bg-hover/60'"
        class="group flex cursor-default items-center rounded-lg px-3 py-2 text-sm"
        @click="$emit('select', s.id)"
      >
        <span class="flex-1 truncate">{{ s.title }}</span>
        <span class="text-xs text-muted group-hover:hidden">{{ s.updatedAt }}</span>
        <button
          class="hidden text-muted hover:text-text group-hover:block"
          title="Delete chat"
          @click.stop="$emit('remove', s.id)"
        >
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>

    <div class="flex items-center gap-3 px-6 py-4 text-sm">
      <span class="flex size-7 items-center justify-center rounded-full bg-hover text-xs font-semibold">LE</span>
      <span class="text-muted">Learn Electrobun</span>
    </div>
  </aside>
</template>
