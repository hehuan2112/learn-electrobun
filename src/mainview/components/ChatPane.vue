<script lang="ts" setup>
import {nextTick, ref, watch} from 'vue'
import type {Message} from '../../shared/rpc'

const props = defineProps<{
  title: string
  messages: Message[]
  busy: boolean
  attachment: string
  panelOpen: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  attach: []
  clearAttachment: []
  togglePanel: []
}>()

const draft = ref('')
const scroller = ref<HTMLElement | null>(null)
const input = ref<HTMLTextAreaElement | null>(null)

function submit() {
  if (!draft.value.trim() || props.busy) return
  emit('send', draft.value)
  draft.value = ''
  nextTick(resize)
}

function onKeydown(e: KeyboardEvent) {
  // Enter sends, Shift+Enter inserts a newline. Skip while an IME is composing.
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    submit()
  }
}

function resize() {
  const el = input.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

// Keep the newest message in view while a reply streams in.
watch(
  () => props.messages.map(m => m.content.length).join(),
  () => nextTick(() => scroller.value?.scrollTo({top: scroller.value.scrollHeight})),
)

defineExpose({focus: () => input.value?.focus()})
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col bg-canvas">
    <header class="electrobun-webkit-app-region-drag flex h-12 shrink-0 items-center justify-between px-4">
      <span class="truncate text-sm font-medium">{{ title }}</span>
      <button
        :class="panelOpen ? 'text-text' : 'text-muted'"
        class="electrobun-webkit-app-region-no-drag rounded-md p-1.5 hover:bg-hover"
        title="Toggle context panel"
        @click="$emit('togglePanel')"
      >
        <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect height="16" rx="2" width="18" x="3" y="4"/>
          <path d="M15 4v16"/>
        </svg>
      </button>
    </header>

    <div ref="scroller" class="flex-1 overflow-y-auto">
      <div class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
        <div v-if="messages.length === 0" class="mt-32 text-center">
          <div class="text-3xl text-accent">✻</div>
          <h1 class="mt-3 text-2xl font-medium">What shall we learn today?</h1>
          <p class="mt-2 text-sm text-muted">Replies are streamed from the Bun process over Electrobun RPC.</p>
        </div>

        <template v-for="m in messages" :key="m.id">
          <div v-if="m.role === 'user'" class="flex justify-end">
            <div class="selectable max-w-[80%] whitespace-pre-wrap rounded-2xl bg-surface px-4 py-2.5 text-[15px]">
              {{ m.content }}
            </div>
          </div>
          <div v-else class="flex gap-3">
            <span :class="{'animate-spin': m.streaming}" class="mt-0.5 inline-block h-fit text-accent">✻</span>
            <div class="selectable flex-1 whitespace-pre-wrap text-[15px] leading-7">
              {{ m.content }}<span v-if="m.streaming" class="ml-0.5 inline-block h-4 w-2 animate-pulse bg-muted align-middle"></span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="mx-auto w-full max-w-3xl px-6 pb-6">
      <div class="rounded-2xl bg-surface p-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div v-if="attachment" class="mb-2 flex items-center gap-2 rounded-lg bg-hover px-3 py-1.5 text-xs">
          <span class="flex-1 truncate">📎 {{ attachment }}</span>
          <button class="text-muted hover:text-text" @click="$emit('clearAttachment')">✕</button>
        </div>
        <textarea
          ref="input"
          v-model="draft"
          class="selectable block max-h-[200px] w-full resize-none bg-transparent px-1 text-[15px] outline-none placeholder:text-muted"
          placeholder="Reply…"
          rows="1"
          @input="resize"
          @keydown="onKeydown"
        ></textarea>
        <div class="mt-2 flex items-center justify-between">
          <button class="rounded-md p-1.5 text-muted hover:bg-hover hover:text-text" title="Attach a file"
                  @click="$emit('attach')">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            :disabled="busy || !draft.trim()"
            class="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg disabled:opacity-40"
            title="Send"
            @click="submit"
          >
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
